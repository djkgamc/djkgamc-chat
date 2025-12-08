import { getDeveloperPrompt, INITIAL_MODEL, FOLLOW_UP_MODEL, FOLLOW_UP_REASONING } from "@/config/constants";
import { getTools } from "@/lib/tools/tools";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { messages, toolsState, turnCount } = await request.json();

    const tools = await getTools(toolsState);

    const isFirstTurn = (turnCount || 0) <= 1;
    const model = isFirstTurn ? INITIAL_MODEL : FOLLOW_UP_MODEL;

    console.log(`Turn ${turnCount}, using model: ${model}`);
    console.log("Tools:", tools);
    console.log("Received messages:", messages);

    const openai = new OpenAI();

    const baseOptions = {
      model,
      input: messages,
      instructions: getDeveloperPrompt(),
      tools,
      stream: true as const,
      parallel_tool_calls: false,
      store: false,
    };

    const events = isFirstTurn
      ? await openai.responses.create(baseOptions)
      : await openai.responses.create({
          ...baseOptions,
          reasoning: { effort: FOLLOW_UP_REASONING as "low" | "medium" | "high" },
        });

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
          }
          // End of stream
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
