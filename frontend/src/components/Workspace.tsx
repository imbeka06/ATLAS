"use client";
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from './MermaidDiagram';
import FileExplorer from './FileExplorer';
import WebPreview from './WebPreview';

interface WorkspaceProps {
  activeTab: 'srs' | 'diagram' | 'code' | 'preview';
  content: string;
}

const parseFilesFromMarkdown = (markdown: string): Record<string, string> => {
  const files: Record<string, string> = {};
  
  const blockRegex = /(?:\*\*`?([^`*]+)`?\*\*|###\s*([^\n]+))\s*```[a-z]*\n([\s\S]*?)```/gi;
  let match;
  let found = false;

  while ((match = blockRegex.exec(markdown)) !== null) {
    found = true;
    const fileName = (match[1] || match[2]).trim();
    files[fileName] = match[3].trim();
  }

  if (!found) {
    const fallbackRegex = /```([a-z]*)\n([\s\S]*?)```/gi;
    let index = 1;
    while ((match = fallbackRegex.exec(markdown)) !== null) {
        const lang = match[1].toLowerCase();
        if (lang === 'mermaid') continue; 
        
        const content = match[2].trim();
        let ext = 'txt';
        
        if (lang === 'html' || content.includes('<!DOCTYPE') || content.includes('<html')) ext = 'html';
        else if (lang === 'css' || content.includes('margin:') || content.includes('color:')) ext = 'css';
        else if (lang === 'js' || lang === 'javascript') ext = 'js';
        else if (lang) ext = lang;

        files[`generated_file_${index}.${ext}`] = content;
        index++;
    }
  }

  return Object.keys(files).length > 0 ? files : { "info.txt": "No code blocks found in response." };
};

export default function Workspace({ activeTab, content }: WorkspaceProps) {
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

  const dynamicFiles = parseFilesFromMarkdown(content);

  const getFilteredContent = () => {
    if (activeTab === 'srs') {
      let srsContent = content.replace(/```[\s\S]*?```/g, '');
      srsContent = srsContent.replace(/\*\*`?[^`*]+`?\*\*/g, '');
      return srsContent.trim() || "No SRS content generated yet.";
    }
    if (activeTab === 'diagram') {
        const mermaidMatches = [];
        const regex = /```mermaid\n([\s\S]*?)```/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
            mermaidMatches.push(match);
        }
        if (mermaidMatches.length > 0) {
            return mermaidMatches.map(m => `\`\`\`mermaid\n${m[1]}\n\`\`\``).join('\n\n');
        }
        return "No diagrams generated yet.";
    }
    return content;
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
                {content ? (
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