"use client";
import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import Workspace from "@/components/Workspace";
import { sendMessage, ProjectState } from "@/lib/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
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

  const handleSend = async (msg: string) => {
    setLoading(true);
    try {
      const result = await sendMessage(msg, projectState);
      
      setProjectState(result.updated_state);
      setLastModel(result.model_used);
      
    } catch (e) {
      console.error(e);
      alert("Failed to connect to Backend.");
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
      
      <div className="flex-1 h-full bg-slate-50">
        <Workspace activeTab="srs" content={workspaceContent} />
      </div>
    </main>
  );
}