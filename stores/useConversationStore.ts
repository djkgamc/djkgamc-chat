import { create } from "zustand";
import { Item } from "@/lib/assistant";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { INITIAL_MESSAGE } from "@/config/constants";

export type StreamingPhase = 
  | "idle"
  | "thinking"
  | "searching_web"
  | "searching_files"
  | "running_code"
  | "calling_function"
  | "calling_mcp"
  | "generating"
  | "deep_researching"
  | "synthesizing";

interface ConversationState {
  chatMessages: Item[];
  conversationItems: any[];
  isAssistantLoading: boolean;
  streamingPhase: StreamingPhase;
  isStreaming: boolean;

  setChatMessages: (items: Item[]) => void;
  setConversationItems: (messages: any[]) => void;
  addChatMessage: (item: Item) => void;
  addConversationItem: (message: ChatCompletionMessageParam) => void;
  setAssistantLoading: (loading: boolean) => void;
  setStreamingPhase: (phase: StreamingPhase) => void;
  setIsStreaming: (streaming: boolean) => void;
  rawSet: (state: any) => void;
  resetConversation: () => void;
}

const useConversationStore = create<ConversationState>((set) => ({
  chatMessages: [
    {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: INITIAL_MESSAGE }],
    },
  ],
  conversationItems: [],
  isAssistantLoading: false,
  streamingPhase: "idle",
  isStreaming: false,
  setChatMessages: (items) => set({ chatMessages: items }),
  setConversationItems: (messages) => set({ conversationItems: messages }),
  addChatMessage: (item) =>
    set((state) => ({ chatMessages: [...state.chatMessages, item] })),
  addConversationItem: (message) =>
    set((state) => ({
      conversationItems: [...state.conversationItems, message],
    })),
  setAssistantLoading: (loading) => set({ isAssistantLoading: loading }),
  setStreamingPhase: (phase) => set({ streamingPhase: phase }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  rawSet: set,
  resetConversation: () =>
    set(() => ({
      chatMessages: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: INITIAL_MESSAGE }],
        },
      ],
      conversationItems: [],
      streamingPhase: "idle",
      isStreaming: false,
    })),
}));

export default useConversationStore;
