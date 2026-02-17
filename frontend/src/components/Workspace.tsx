"use client";
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from './MermaidDiagram';
import FileExplorer from './FileExplorer';

interface WorkspaceProps {
  activeTab: 'srs' | 'diagram' | 'code';
  content: string;
}

export default function Workspace({ activeTab, content }: WorkspaceProps) {
  
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const isMermaid = match && match[1] === 'mermaid';

      if (!inline && isMermaid) {
        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  const mockFiles = {
    "backend/main.py": "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {'Hello': 'World'}",
    "frontend/page.tsx": "export default function Home() {\n  return <h1>Hello World</h1>\n}",
    "README.md": "# Project Title\n\nThis is a generated project structure."
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {}

      <div className="flex-1 overflow-auto p-0 bg-slate-50">
        {activeTab === 'code' ? (
             <div className="h-full p-4">
                <FileExplorer files={mockFiles} />
             </div>
        ) : (
            <div className="p-8">
                <article className="prose prose-slate max-w-none">
                {content ? (
                    <ReactMarkdown components={components}>
                    {content}
                    </ReactMarkdown>
                ) : (
                    <div className="text-center text-slate-400 mt-20">
                    <p>No content generated yet.</p>
                    </div>
                )}
                </article>
            </div>
        )}
      </div>
    </div>
  );
}