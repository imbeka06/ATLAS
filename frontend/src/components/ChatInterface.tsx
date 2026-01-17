"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, Cpu } from "lucide-react";

interface ChatProps {
  history: { role: string; content: string }[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  lastModelUsed?: string;
}

export default function ChatInterface({ history, onSendMessage, isLoading, lastModelUsed }: ChatProps) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-[85%] text-sm ${
              msg.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-800 shadow-sm"
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 p-3">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        {lastModelUsed && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                <Cpu size={12} />
                <span>Processed by: {lastModelUsed}</span>
            </div>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe your system..."
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}