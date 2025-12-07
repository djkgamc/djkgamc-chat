"use client";

import React, { useState } from "react";
import useConversationStore, { ClarifyingQuestion } from "@/stores/useConversationStore";
import { MessageCircleQuestion, Send, X } from "lucide-react";

const ClarifyingQuestions: React.FC = () => {
  const { clarifyingState, setClarifyingState } = useConversationStore();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [customInput, setCustomInput] = useState("");

  if (!clarifyingState.isActive) return null;

  const handleOptionSelect = (questionIndex: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const handleSubmit = () => {
    let refinedQuery = clarifyingState.originalQuery;

    const answers = Object.entries(selectedAnswers)
      .map(([idx, answer]) => {
        const question = clarifyingState.questions[parseInt(idx)];
        return `${question.question} ${answer}`;
      })
      .join(" ");

    if (answers) {
      refinedQuery = `${clarifyingState.originalQuery}\n\nAdditional context: ${answers}`;
    }

    if (customInput.trim()) {
      refinedQuery = `${refinedQuery}\n\nUser clarification: ${customInput.trim()}`;
    }

    if (clarifyingState.onSubmit) {
      clarifyingState.onSubmit(refinedQuery);
    }

    setClarifyingState({
      isActive: false,
      originalQuery: "",
      questions: [],
      onSubmit: null,
    });
    setSelectedAnswers({});
    setCustomInput("");
  };

  const handleSkip = () => {
    if (clarifyingState.onSubmit) {
      clarifyingState.onSubmit(clarifyingState.originalQuery);
    }

    setClarifyingState({
      isActive: false,
      originalQuery: "",
      questions: [],
      onSubmit: null,
    });
    setSelectedAnswers({});
    setCustomInput("");
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircleQuestion className="w-5 h-5 text-amber-600" />
        <span className="font-medium text-amber-800">
          A few quick questions to improve the research
        </span>
      </div>

      <div className="space-y-4">
        {clarifyingState.questions.map((q: ClarifyingQuestion, idx: number) => (
          <div key={idx} className="space-y-2">
            <p className="text-sm text-gray-700">{q.question}</p>
            {q.options && q.options.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {q.options.map((option, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleOptionSelect(idx, option)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      selectedAnswers[idx] === option
                        ? "bg-amber-500 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:border-amber-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Your answer..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-amber-400"
                onChange={(e) => handleOptionSelect(idx, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="pt-2">
          <input
            type="text"
            placeholder="Add any other details (optional)..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
          Skip
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Send className="w-4 h-4" />
          Start Research
        </button>
      </div>
    </div>
  );
};

export default ClarifyingQuestions;
