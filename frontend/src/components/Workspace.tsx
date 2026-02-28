"use client";
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from './MermaidDiagram';
import FileExplorer from './FileExplorer';
import WebPreview from './WebPreview';

interface WorkspaceProps {
  activeTab: 'srs' | 'architecture' | 'explanation' | 'code' | 'preview';
  history: any[]; // Now accepts the full assistant history
}

// Parses files without the fallback text so we can safely merge them
const extractFilesFromText = (markdown: string): Record<string, string> => {
  const files: Record<string, string> = {};
  const blockRegex = /(?:\*\*`?([^`*\n]+)`?\*\*|###\s*([^\n]+))\s*```[a-z]*\n([\s\S]*?)```/gi;
  let match;
  let found = false;

  while ((match = blockRegex.exec(markdown)) !== null) {
    found = true;
    let rawName = (match[1] || match[2]).trim();
    const fileName = rawName.split('/').pop() || `file_${Date.now()}.txt`;
    const fileContent = match[3].trim();
    if (!fileContent.includes("├──") && !fileContent.includes("└──")) {
        files[fileName] = fileContent;
    }
  }

  if (!found) {
    const fallbackRegex = /```([a-z]*)\n([\s\S]*?)```/gi;
    let index = 1;
    while ((match = fallbackRegex.exec(markdown)) !== null) {
        const lang = match[1].toLowerCase();
        if (['mermaid', 'bash', 'sh', 'text', 'tree', 'plaintext', 'terminal'].includes(lang)) continue;
        const content = match[2].trim();
        if (content.includes("├──") || content.includes("└──")) continue;

        let ext = 'txt';
        if (content.includes('<!DOCTYPE html') || content.includes('<html')) ext = 'html';
        else if (content.includes('body {') || content.includes('margin:')) ext = 'css';
        else if (content.includes('function') || content.includes('import React')) ext = 'js';
        else if (lang) ext = lang;

        const finalName = ext === 'html' ? 'index.html' : `generated_file_${index}.${ext}`;
        files[finalName] = content;
        index++;
    }
  }
  return files;
};

export default function Workspace({ activeTab, history }: WorkspaceProps) {
  // 1. Get the very latest message for the text tabs (SRS, Architecture, Explanation)
  const latestMessage = history.length > 0 ? history[history.length - 1].content : "";

  // 2. ACCUMULATOR: Loop through all history and merge file edits over time
  const dynamicFiles = history.reduce((acc, msg) => {
    const msgFiles = extractFilesFromText(msg.content);
    return { ...acc, ...msgFiles }; // New files overwrite old files with the same name
  }, {} as Record<string, string>);

  // Add fallback only if the final merged system is completely empty
  if (Object.keys(dynamicFiles).length === 0) {
      dynamicFiles["info.txt"] = "No code blocks found.";
  }

  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const isMermaid = match && match[1] === 'mermaid';
      if (!inline && isMermaid) {
        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
      }
      return <code className={className} {...props}>{children}</code>;
    }
  };

  const getFilteredContent = () => {
    if (activeTab === 'srs') {
        const srsMatch = latestMessage.match(/## 1\.\s*SRS Documentation([\s\S]*?)(?=## 2\.|## 3\.|## 4\.)/i);
        if (srsMatch) return srsMatch[1].trim();
        let srsContent = latestMessage.replace(/```mermaid[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').replace(/\*\*`?[^`*]+`?\*\*/g, '');
        return srsContent.trim() || "No SRS documentation found.";
    }
    
    if (activeTab === 'explanation') {
        const expMatch = latestMessage.match(/## 3\.\s*Step-by-Step Explanation([\s\S]*?)(?=## 4\.)/i);
        if (expMatch) return expMatch[1].trim();
        return "No step-by-step explanation generated yet.";
    }

    if (activeTab === 'architecture') {
        const mermaidMatches = [];
        const regex = /```mermaid\n([\s\S]*?)```/gi;
        let match;
        while ((match = regex.exec(latestMessage)) !== null) {
            mermaidMatches.push(match);
        }
        if (mermaidMatches.length > 0) return mermaidMatches.map(m => `\`\`\`mermaid\n${m[1]}\n\`\`\``).join('\n\n');
        return "No diagrams generated yet.";
    }
    
    return latestMessage;
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex-1 overflow-auto p-0 bg-slate-50">
        {activeTab === 'code' ? (
             <div className="h-full p-4">
                <FileExplorer files={dynamicFiles} />
             </div>
        ) : activeTab === 'preview' ? (
             <div className="h-full p-4">
                 <WebPreview files={dynamicFiles} />
             </div>
        ) : (
            <div className="p-8">
                <article className="prose prose-slate max-w-none">
                {latestMessage ? (
                    <ReactMarkdown components={components}>
                    {getFilteredContent()}
                    </ReactMarkdown>
                ) : (
                    <div className="text-center text-slate-400 mt-20">
                    <p>No content generated yet. Describe your system to begin.</p>
                    </div>
                )}
                </article>
            </div>
        )}
      </div>
    </div>
  );
}