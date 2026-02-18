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
  
  const blockRegex = /\*\*`([^`]+)`\*\*\s*```[a-z]*\n([\s\S]*?)```/g;
  let match;
  let found = false;

  while ((match = blockRegex.exec(markdown)) !== null) {
    found = true;
    files[match[1]] = match[2].trim();
  }

  if (!found) {
    const fallbackRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    let index = 1;
    while ((match = fallbackRegex.exec(markdown)) !== null) {
        if (match[1] === 'mermaid') continue; 
        const ext = match[1] === 'html' ? 'html' : match[1] === 'css' ? 'css' : match[1] === 'javascript' || match[1] === 'js' ? 'js' : match[1] === 'python' ? 'py' : match[1] === 'tsx' ? 'tsx' : 'txt';
        files[`generated_file_${index}.${ext}`] = match[2].trim();
        index++;
    }
  }

  return Object.keys(files).length > 0 ? files : { "info.txt": "// Waiting for AI to generate code..." };
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
      const parts = content.split('```mermaid');
      let srsContent = parts[0];
      const codeRegex = /\*\*`([^`]+)`\*\*\s*```[a-z]*\n([\s\S]*?)```/g;
      srsContent = srsContent.replace(codeRegex, '');
      const genericCodeRegex = /```([a-z]*)\n([\s\S]*?)```/g;
      srsContent = srsContent.replace(genericCodeRegex, '');
      return srsContent.trim() || "No SRS content generated yet.";
    }
    if (activeTab === 'diagram') {
        const mermaidMatches = [...content.matchAll(/```mermaid\n([\s\S]*?)```/g)];
        if (mermaidMatches.length > 0) {
            return mermaidMatches.map(m => `\`\`\`mermaid\n${m[1]}\n\`\`\``).join('\n\n');
        }
        return "No diagrams generated yet. Ask the AI to create an ERD, DFD, or Flowchart.";
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