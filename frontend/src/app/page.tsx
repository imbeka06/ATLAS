"use client";
import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import Workspace from "@/components/Workspace";
import { sendMessage, ProjectState, Attachment } from "@/lib/api";
import { MessageSquare, Plus, Trash2, Menu } from "lucide-react";

const createNewProject = (): ProjectState => ({
  id: Date.now().toString(),
  name: "New Chat",
  phase: "discovery",
  tech_stack: [],
  history: []
});

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'srs' | 'architecture' | 'explanation' | 'code' | 'preview'>('srs');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [projects, setProjects] = useState<ProjectState[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("architect_projects");
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed);
      if (parsed.length > 0) setActiveProjectId(parsed[0].id);
    } else {
      const initial = createNewProject();
      setProjects([initial]);
      setActiveProjectId(initial.id);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("architect_projects", JSON.stringify(projects));
    }
  }, [projects, isMounted]);

  if (!isMounted) return null;

  const activeProject = projects.find(p => p.id === activeProjectId) || createNewProject();

  const handleNewChat = () => {
    const newProj = createNewProject();
    setProjects([newProj, ...projects]);
    setActiveProjectId(newProj.id);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = projects.filter(p => p.id !== id);
    if (filtered.length === 0) {
      const newProj = createNewProject();
      setProjects([newProj]);
      setActiveProjectId(newProj.id);
    } else {
      setProjects(filtered);
      if (activeProjectId === id) setActiveProjectId(filtered[0].id);
    }
  };

  const workspaceContent = activeProject.history
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.content || "";

  const handleSend = async (msg: string, attachment?: Attachment) => {
    setLoading(true);
    
    let currentName = activeProject.name;
    if (activeProject.history.length === 0 && currentName === "New Chat") {
      currentName = msg.slice(0, 20) + (msg.length > 20 ? "..." : "");
    }

    const tempProject = {
      ...activeProject,
      name: currentName,
      history: [...activeProject.history, { role: "user", content: msg, attachment }]
    };

    setProjects(projects.map(p => p.id === activeProjectId ? tempProject : p));

    try {
      const result = await sendMessage(msg, tempProject, attachment);
      setProjects(prev => prev.map(p => p.id === activeProjectId ? result.updated_state : p));
      
      if (result.updated_state.phase === 'architecture') setActiveTab('architecture');
      if (result.updated_state.phase === 'coding') setActiveTab('code');

    } catch (e) {
      const errorProject = {
        ...tempProject,
        history: [...tempProject.history, { role: "assistant", content: "⚠️ **System Offline:** Backend is not reachable." }]
      };
      setProjects(prev => prev.map(p => p.id === activeProjectId ? errorProject : p));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white">
      
      {/* Animated Sidebar */}
      <div className={`${isSidebarOpen ? 'w-[250px] border-r' : 'w-0 border-r-0'} flex-shrink-0 h-full border-slate-200 bg-slate-50 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-4 border-b border-slate-200 min-w-[250px]">
            <button 
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium"
            >
                <Plus size={16} />
                New Chat
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-w-[250px]">
            {projects.map(p => (
                <div 
                    key={p.id}
                    onClick={() => setActiveProjectId(p.id)}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-sm ${activeProjectId === p.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-slate-200 text-slate-700'}`}
                >
                    <div className="flex items-center gap-2 truncate">
                        <MessageSquare size={14} />
                        <span className="truncate">{p.name}</span>
                    </div>
                    <button onClick={(e) => handleDeleteChat(p.id, e)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* Chat Interface Column */}
      <div className="w-[400px] flex-shrink-0 h-full border-r border-slate-200 flex flex-col">
        {/* Toggle Header */}
        <div className="flex items-center p-3 border-b border-slate-200 bg-white">
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-1.5 mr-3 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-md transition-colors"
            >
                <Menu size={20} />
            </button>
            <span className="font-semibold text-sm text-slate-700">Project Console</span>
        </div>
        <div className="flex-1 overflow-hidden">
            <ChatInterface 
            history={activeProject.history} 
            onSendMessage={handleSend} 
            isLoading={loading}
            />
        </div>
      </div>
      
      {/* Workspace Area */}
      <div className="flex-1 h-full bg-slate-50 flex flex-col overflow-hidden">
         <div className="flex border-b border-slate-200 px-4 bg-white items-center flex-shrink-0">
            {['srs', 'architecture', 'explanation', 'code', 'preview'].map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 capitalize transition-colors ${
                activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
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