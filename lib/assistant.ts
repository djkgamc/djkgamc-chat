import { parse } from "partial-json";
import { handleTool } from "@/lib/tools/tools-handling";
import useConversationStore from "@/stores/useConversationStore";
import useToolsStore, { ToolsState } from "@/stores/useToolsStore";
import { Annotation } from "@/components/annotations";
import { functionsMap } from "@/config/functions";

const normalizeAnnotation = (annotation: any): Annotation => ({
  ...annotation,
  fileId: annotation.file_id ?? annotation.fileId,
  containerId: annotation.container_id ?? annotation.containerId,
});

export interface ContentItem {
  type: "input_text" | "output_text" | "refusal" | "output_audio";
  annotations?: Annotation[];
  text?: string;
}

// Message items for storing conversation history matching API shape
export interface MessageItem {
  type: "message";
  role: "user" | "assistant" | "system";
  id?: string;
  content: ContentItem[];
}

// Custom items to display in chat
export interface ToolCallItem {
  type: "tool_call";
  tool_type:
    | "file_search_call"
    | "web_search_call"
    | "function_call"
    | "mcp_call"
    | "code_interpreter_call";
  status: "in_progress" | "completed" | "failed" | "searching";
  id: string;
  name?: string | null;
  call_id?: string;
  arguments?: string;
  parsedArguments?: any;
  output?: string | null;
  code?: string;
  files?: {
    file_id: string;
    mime_type: string;
    container_id?: string;
    filename?: string;
  }[];
}

export interface McpListToolsItem {
  type: "mcp_list_tools";
  id: string;
  server_label: string;
  tools: { name: string; description?: string }[];
}

export interface McpApprovalRequestItem {
  type: "mcp_approval_request";
  id: string;
  server_label: string;
  name: string;
  arguments?: string;
}

export type Item =
  | MessageItem
  | ToolCallItem
  | McpListToolsItem
  | McpApprovalRequestItem;

export const handleTurn = async (
  messages: any[],
  toolsState: ToolsState,
  onMessage: (data: any) => void
) => {
  try {
    const { googleIntegrationEnabled } = useToolsStore.getState();
    
    const turnCount = messages.filter((m: any) => m.role === "user").length;
    
    const response = await fetch("/api/turn_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages,
        toolsState: toolsState,
        googleIntegrationEnabled,
        turnCount,
      }),
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return;
    }

    // Reader for streaming data
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      buffer += chunkValue;

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") {
            done = true;
            break;
          }
          const data = JSON.parse(dataStr);
          onMessage(data);
        }
      }
    }

    // Handle any remaining data in buffer
    if (buffer && buffer.startsWith("data: ")) {
      const dataStr = buffer.slice(6);
      if (dataStr !== "[DONE]") {
        const data = JSON.parse(dataStr);
        onMessage(data);
      }
    }
  } catch (error) {
    console.error("Error handling turn:", error);
  }
};

const runDeepResearch = async (query: string): Promise<string | null> => {
  const {
    chatMessages,
    setChatMessages,
    setStreamingPhase,
  } = useConversationStore.getState();

  setStreamingPhase("deep_researching");

  chatMessages.push({
    type: "tool_call",
    tool_type: "web_search_call",
    status: "searching",
    id: "deep-research-" + Date.now(),
    name: "Deep Research",
  } as ToolCallItem);
  setChatMessages([...chatMessages]);

  try {
    const response = await fetch("/api/deep_research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (response.ok) {
      const { report } = await response.json();

      const lastToolCall = chatMessages[chatMessages.length - 1];
      if (lastToolCall && lastToolCall.type === "tool_call") {
        lastToolCall.status = "completed";
        lastToolCall.output = "Research completed";
      }
      setChatMessages([...chatMessages]);
      return report;
    } else {
      const lastToolCall = chatMessages[chatMessages.length - 1];
      if (lastToolCall && lastToolCall.type === "tool_call") {
        lastToolCall.status = "failed";
      }
      setChatMessages([...chatMessages]);
      console.error("Deep research failed");
      return null;
    }
  } catch (error) {
    console.error("Error during deep research:", error);
    const lastToolCall = chatMessages[chatMessages.length - 1];
    if (lastToolCall && lastToolCall.type === "tool_call") {
      lastToolCall.status = "failed";
    }
    setChatMessages([...chatMessages]);
    return null;
  }
};

export const continueWithDeepResearch = async (refinedQuery: string) => {
  const {
    conversationItems,
    setConversationItems,
    setAssistantLoading,
  } = useConversationStore.getState();

  setAssistantLoading(true);

  const updatedConversationItems = [
    ...conversationItems.slice(0, -1),
    {
      role: "user",
      content: refinedQuery,
    },
  ];
  setConversationItems(updatedConversationItems);

  await processMessages(true, true);
};

export const processMessages = async (isNewUserTurn: boolean = false, skipClarification: boolean = false) => {
  const {
    chatMessages,
    conversationItems,
    setChatMessages,
    setConversationItems,
    setAssistantLoading,
    setStreamingPhase,
    setIsStreaming,
    setClarifyingState,
  } = useConversationStore.getState();
  
  setStreamingPhase("thinking");

  const toolsState = useToolsStore.getState() as ToolsState;

  let allConversationItems = [...conversationItems];

  if (toolsState.deepResearchEnabled && isNewUserTurn) {
    const lastItem = conversationItems[conversationItems.length - 1];
    const isUserMessage = lastItem && lastItem.role === "user";
    
    if (isUserMessage) {
      const userQuery = typeof lastItem.content === "string" 
        ? lastItem.content 
        : lastItem.content?.[0]?.text || lastItem.content;

      if (!skipClarification) {
        setStreamingPhase("clarifying");

        try {
          const clarifyResponse = await fetch("/api/clarify_query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: userQuery }),
          });

          const clarifyResult = await clarifyResponse.json();

          if (!clarifyResult.shouldSkip && clarifyResult.questions?.length > 0) {
            setAssistantLoading(false);
            setStreamingPhase("idle");
            
            setClarifyingState({
              isActive: true,
              originalQuery: userQuery,
              questions: clarifyResult.questions,
              onSubmit: continueWithDeepResearch,
            });
            return;
          }
        } catch (error) {
          console.error("Error during clarification:", error);
        }
      }

      const report = await runDeepResearch(userQuery);

      if (report) {
        setStreamingPhase("synthesizing");

        allConversationItems = [
          ...conversationItems,
          {
            role: "system",
            content: `The following is a deep research report relevant to the user's question. Use this research to provide a comprehensive, well-structured response:

---
DEEP RESEARCH REPORT:
${report}
---

Based on this research, provide an insightful response that:
1. Directly answers the original question
2. Synthesizes the key findings from the research
3. Provides relevant context and insights
4. Uses citations where appropriate`,
          },
        ];
      }
    }
  }

  let assistantMessageContent = "";
  let functionArguments = "";
  let mcpArguments = "";

  await handleTurn(
    allConversationItems,
    toolsState,
    async ({ event, data }) => {
      switch (event) {
        case "response.output_text.delta":
        case "response.output_text.annotation.added": {
          const { delta, item_id, annotation } = data;
          
          setStreamingPhase("generating");
          setIsStreaming(true);

          let partial = "";
          if (typeof delta === "string") {
            partial = delta;
          }
          assistantMessageContent += partial;

          // If the last message isn't an assistant message, create a new one
          const lastItem = chatMessages[chatMessages.length - 1];
          if (
            !lastItem ||
            lastItem.type !== "message" ||
            lastItem.role !== "assistant" ||
            (lastItem.id && lastItem.id !== item_id)
          ) {
            chatMessages.push({
              type: "message",
              role: "assistant",
              id: item_id,
              content: [
                {
                  type: "output_text",
                  text: assistantMessageContent,
                },
              ],
            } as MessageItem);
          } else {
            const contentItem = lastItem.content[0];
            if (contentItem && contentItem.type === "output_text") {
              contentItem.text = assistantMessageContent;
              if (annotation) {
                contentItem.annotations = [
                  ...(contentItem.annotations ?? []),
                  normalizeAnnotation(annotation),
                ];
              }
            }
          }

          setChatMessages([...chatMessages]);
          setAssistantLoading(false);
          break;
        }

        case "response.output_item.added": {
          const { item } = data || {};
          // New item coming in
          if (!item || !item.type) {
            break;
          }
          setAssistantLoading(false);
          // Handle differently depending on the item type
          switch (item.type) {
            case "message": {
              const text = item.content?.text || "";
              const annotations =
                item.content?.annotations?.map(normalizeAnnotation) || [];
              chatMessages.push({
                type: "message",
                role: "assistant",
                content: [
                  {
                    type: "output_text",
                    text,
                    ...(annotations.length > 0 ? { annotations } : {}),
                  },
                ],
              });
              conversationItems.push({
                role: "assistant",
                content: [
                  {
                    type: "output_text",
                    text,
                    ...(annotations.length > 0 ? { annotations } : {}),
                  },
                ],
              });
              setChatMessages([...chatMessages]);
              setConversationItems([...conversationItems]);
              break;
            }
            case "function_call": {
              setStreamingPhase("calling_function");
              functionArguments += item.arguments || "";
              chatMessages.push({
                type: "tool_call",
                tool_type: "function_call",
                status: "in_progress",
                id: item.id,
                name: item.name,
                arguments: item.arguments || "",
                parsedArguments: {},
                output: null,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "web_search_call": {
              setStreamingPhase("searching_web");
              chatMessages.push({
                type: "tool_call",
                tool_type: "web_search_call",
                status: item.status || "in_progress",
                id: item.id,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "file_search_call": {
              setStreamingPhase("searching_files");
              chatMessages.push({
                type: "tool_call",
                tool_type: "file_search_call",
                status: item.status || "in_progress",
                id: item.id,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "mcp_call": {
              setStreamingPhase("calling_mcp");
              mcpArguments = item.arguments || "";
              chatMessages.push({
                type: "tool_call",
                tool_type: "mcp_call",
                status: "in_progress",
                id: item.id,
                name: item.name,
                arguments: item.arguments || "",
                parsedArguments: item.arguments ? parse(item.arguments) : {},
                output: null,
              });
              setChatMessages([...chatMessages]);
              break;
            }
            case "code_interpreter_call": {
              setStreamingPhase("running_code");
              chatMessages.push({
                type: "tool_call",
                tool_type: "code_interpreter_call",
                status: item.status || "in_progress",
                id: item.id,
                code: "",
                files: [],
              });
              setChatMessages([...chatMessages]);
              break;
            }
          }
          break;
        }

        case "response.output_item.done": {
          // After output item is done, adding tool call ID
          const { item } = data || {};
          const toolCallMessage = chatMessages.find((m) => m.id === item.id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.call_id = item.call_id;
            setChatMessages([...chatMessages]);
          }
          conversationItems.push(item);
          setConversationItems([...conversationItems]);
          if (
            toolCallMessage &&
            toolCallMessage.type === "tool_call" &&
            toolCallMessage.tool_type === "function_call"
          ) {
            // Handle tool call (execute function)
            const toolResult = await handleTool(
              toolCallMessage.name as keyof typeof functionsMap,
              toolCallMessage.parsedArguments
            );

            // Record tool output
            toolCallMessage.output = JSON.stringify(toolResult);
            setChatMessages([...chatMessages]);
            conversationItems.push({
              type: "function_call_output",
              call_id: toolCallMessage.call_id,
              status: "completed",
              output: JSON.stringify(toolResult),
            });
            setConversationItems([...conversationItems]);

            // Create another turn after tool output has been added
            await processMessages();
          }
          if (
            toolCallMessage &&
            toolCallMessage.type === "tool_call" &&
            toolCallMessage.tool_type === "mcp_call"
          ) {
            toolCallMessage.output = item.output;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.function_call_arguments.delta": {
          // Streaming arguments delta to show in the chat
          functionArguments += data.delta || "";
          let parsedFunctionArguments = {};

          const toolCallMessage = chatMessages.find(
            (m) => m.id === data.item_id
          );
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = functionArguments;
            try {
              if (functionArguments.length > 0) {
                parsedFunctionArguments = parse(functionArguments);
              }
              toolCallMessage.parsedArguments = parsedFunctionArguments;
            } catch {
              // partial JSON can fail parse; ignore
            }
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.function_call_arguments.done": {
          // This has the full final arguments string
          const { item_id, arguments: finalArgs } = data;

          functionArguments = finalArgs;

          // Mark the tool_call as "completed" and parse the final JSON
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = finalArgs;
            toolCallMessage.parsedArguments = parse(finalArgs);
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }
        // Streaming MCP tool call arguments
        case "response.mcp_call_arguments.delta": {
          // Append delta to MCP arguments
          mcpArguments += data.delta || "";
          let parsedMcpArguments: any = {};
          const toolCallMessage = chatMessages.find(
            (m) => m.id === data.item_id
          );
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = mcpArguments;
            try {
              if (mcpArguments.length > 0) {
                parsedMcpArguments = parse(mcpArguments);
              }
              toolCallMessage.parsedArguments = parsedMcpArguments;
            } catch {
              // partial JSON can fail parse; ignore
            }
            setChatMessages([...chatMessages]);
          }
          break;
        }
        case "response.mcp_call_arguments.done": {
          // Final MCP arguments string received
          const { item_id, arguments: finalArgs } = data;
          mcpArguments = finalArgs;
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.arguments = finalArgs;
            toolCallMessage.parsedArguments = parse(finalArgs);
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.web_search_call.completed": {
          const { item_id, output } = data;
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.output = output;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.file_search_call.completed": {
          const { item_id, output } = data;
          const toolCallMessage = chatMessages.find((m) => m.id === item_id);
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.output = output;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.code_interpreter_call_code.delta": {
          const { delta, item_id } = data;
          const toolCallMessage = [...chatMessages]
            .reverse()
            .find(
              (m) =>
                m.type === "tool_call" &&
                m.tool_type === "code_interpreter_call" &&
                m.status !== "completed" &&
                m.id === item_id
            ) as ToolCallItem | undefined;
          // Accumulate deltas to show the code streaming
          if (toolCallMessage) {
            toolCallMessage.code = (toolCallMessage.code || "") + delta;
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.code_interpreter_call_code.done": {
          const { code, item_id } = data;
          const toolCallMessage = [...chatMessages]
            .reverse()
            .find(
              (m) =>
                m.type === "tool_call" &&
                m.tool_type === "code_interpreter_call" &&
                m.status !== "completed" &&
                m.id === item_id
            ) as ToolCallItem | undefined;

          // Mark the call as completed and set the code
          if (toolCallMessage) {
            toolCallMessage.code = code;
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.code_interpreter_call.completed": {
          const { item_id } = data;
          const toolCallMessage = chatMessages.find(
            (m) => m.type === "tool_call" && m.id === item_id
          ) as ToolCallItem | undefined;
          if (toolCallMessage) {
            toolCallMessage.status = "completed";
            setChatMessages([...chatMessages]);
          }
          break;
        }

        case "response.completed": {
          console.log("response completed", data);
          setStreamingPhase("idle");
          setIsStreaming(false);
          
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Response ready", {
                body: "Your assistant has finished responding",
                icon: "/openai_logo.svg",
              });
            }
          }
          
          const { response } = data;

          // Handle MCP tools list (append all lists, not just the first)
          const mcpListToolsMessages = response.output.filter(
            (m: Item) => m.type === "mcp_list_tools"
          ) as McpListToolsItem[];

          if (mcpListToolsMessages && mcpListToolsMessages.length > 0) {
            for (const msg of mcpListToolsMessages) {
              chatMessages.push({
                type: "mcp_list_tools",
                id: msg.id,
                server_label: msg.server_label,
                tools: msg.tools || [],
              });
            }
            setChatMessages([...chatMessages]);
          }

          // Handle MCP approval request
          const mcpApprovalRequestMessage = response.output.find(
            (m: Item) => m.type === "mcp_approval_request"
          );

          if (mcpApprovalRequestMessage) {
            chatMessages.push({
              type: "mcp_approval_request",
              id: mcpApprovalRequestMessage.id,
              server_label: mcpApprovalRequestMessage.server_label,
              name: mcpApprovalRequestMessage.name,
              arguments: mcpApprovalRequestMessage.arguments,
            });
            setChatMessages([...chatMessages]);
          }

          break;
        }

        // Handle other events as needed
      }
    }
  );
};
