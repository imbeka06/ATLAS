"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, Paperclip, X, Image as ImageIcon } from "lucide-react";
import { Attachment, Message } from "@/lib/api";

interface ChatProps {
  history: Message[];
  onSendMessage: (msg: string, attachment?: Attachment) => void;
  isLoading: boolean;
  lastModelUsed?: string;
}

export default function ChatInterface({ history, onSendMessage, isLoading, lastModelUsed }: ChatProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<Attachment | undefined>();
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = () => {
    if (!input.trim() && !attachment) return;
    onSendMessage(input, attachment);
    setInput("");
    setAttachment(undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachment({
        name: file.name,
        data: base64,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            {msg.attachment && msg.attachment.type.startsWith('image/') && (
                <img src={msg.attachment.data} alt="attachment" className="max-w-full h-auto rounded mb-2 max-h-40 object-contain bg-white" />
            )}
            {msg.attachment && !msg.attachment.type.startsWith('image/') && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-black/10 rounded">
                    <Paperclip size={14} />
                    <span className="font-medium text-xs truncate">{msg.attachment.name}</span>
                </div>
            )}
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
        
        {attachment && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                {attachment.type.startsWith('image/') ? <ImageIcon size={14} className="text-blue-600"/> : <Paperclip size={14} className="text-blue-600" />}
                <span className="text-xs text-blue-700 font-medium truncate flex-1">{attachment.name}</span>
                <button onClick={() => setAttachment(undefined)} className="text-slate-400 hover:text-red-500">
                    <X size={14} />
                </button>
            </div>
        )}

        <div className="flex gap-2 items-center">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.md"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Paperclip size={20} />
          </button>
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
            disabled={isLoading || (!input.trim() && !attachment)}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}