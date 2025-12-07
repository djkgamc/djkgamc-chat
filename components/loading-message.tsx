import React from "react";
import useConversationStore, { StreamingPhase } from "@/stores/useConversationStore";
import { Globe, BookOpenText, Code2, Zap, Brain, Sparkles, FlaskConical, Wand2 } from "lucide-react";

const phaseConfig: Record<StreamingPhase, { icon: React.ReactNode; text: string; color: string }> = {
  idle: { icon: null, text: "", color: "" },
  thinking: { 
    icon: <Brain className="w-4 h-4" />, 
    text: "Thinking", 
    color: "text-purple-500" 
  },
  searching_web: { 
    icon: <Globe className="w-4 h-4" />, 
    text: "Searching the web", 
    color: "text-blue-500" 
  },
  searching_files: { 
    icon: <BookOpenText className="w-4 h-4" />, 
    text: "Searching files", 
    color: "text-green-500" 
  },
  running_code: { 
    icon: <Code2 className="w-4 h-4" />, 
    text: "Running code", 
    color: "text-orange-500" 
  },
  calling_function: { 
    icon: <Zap className="w-4 h-4" />, 
    text: "Calling function", 
    color: "text-yellow-500" 
  },
  calling_mcp: { 
    icon: <Zap className="w-4 h-4" />, 
    text: "Calling MCP tool", 
    color: "text-indigo-500" 
  },
  generating: { 
    icon: <Sparkles className="w-4 h-4" />, 
    text: "Generating", 
    color: "text-pink-500" 
  },
  deep_researching: { 
    icon: <FlaskConical className="w-4 h-4" />, 
    text: "Deep researching", 
    color: "text-purple-600" 
  },
  synthesizing: { 
    icon: <Wand2 className="w-4 h-4" />, 
    text: "Synthesizing insights", 
    color: "text-violet-500" 
  },
  clarifying: { 
    icon: <Brain className="w-4 h-4" />, 
    text: "Analyzing query", 
    color: "text-amber-500" 
  },
};

const LoadingMessage: React.FC = () => {
  const { streamingPhase } = useConversationStore();
  const config = phaseConfig[streamingPhase] || phaseConfig.thinking;

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 py-2">
        <div className={`flex items-center gap-2 ${config.color}`}>
          <div className="animate-pulse">
            {config.icon || <Brain className="w-4 h-4" />}
          </div>
          <span className="text-sm font-medium">
            {config.text || "Thinking"}
          </span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage;
