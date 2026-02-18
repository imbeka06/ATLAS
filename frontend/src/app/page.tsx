"use client";
import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import Workspace from "@/components/Workspace";
import { sendMessage, ProjectState, Attachment } from "@/lib/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'srs' | 'diagram' | 'code' | 'preview'>('srs');
  const [lastModel, setLastModel] = useState<string>(""); 

  const [projectState, setProjectState] = useState<ProjectState>({
    name: "New Project",
    phase: "discovery",
    tech_stack: [],
    history: []
  });
  
  const workspaceContent = projectState.history
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.content || "";

  const handleSend = async (msg: string, attachment?: Attachment) => {
    setLoading(true);
    const tempHistory = [...projectState.history, { role: "user", content: msg, attachment }];
    setProjectState({ ...projectState, history: tempHistory });

    try {
      const result = await sendMessage(msg, projectState, attachment);
      setProjectState(result.updated_state);
      setLastModel(result.model_used);
      
      if (result.updated_state.phase === 'architecture') setActiveTab('diagram');
      if (result.updated_state.phase === 'coding') setActiveTab('code');

    } catch (e) {
      const errorMessage = { 
        role: "assistant", 
        content: "⚠️ **System Offline:** Backend is not reachable." 
      };
      setProjectState({ 
        ...projectState, 
        history: [...tempHistory, errorMessage] 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white">
      <div className="w-[400px] flex-shrink-0 h-full border-r border-slate-200">
        <ChatInterface 
          history={projectState.history} 
          onSendMessage={handleSend} 
          isLoading={loading}
          lastModelUsed={lastModel}
        />
      </div>
      
      <div className="flex-1 h-full bg-slate-50 flex flex-col">
         <div className="flex border-b border-slate-200 px-4 bg-white items-center">
            {['srs', 'diagram', 'code', 'preview'].map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 capitalize ${
                activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
                {tab}
            </button>
            ))}
        </div>

        <div className="flex-1 overflow-hidden">
            <Workspace activeTab={activeTab} content={workspaceContent} />
        </div>
      </div>
    </main>
  );
}