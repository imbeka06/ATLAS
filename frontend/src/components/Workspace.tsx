"use client";
import ReactMarkdown from 'react-markdown';
import MermaidDiagram from './MermaidDiagram';

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

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex border-b border-slate-200 px-4">
        {['srs', 'diagram', 'code'].map((tab) => (
          <button
            key={tab}
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

      <div className="flex-1 overflow-auto p-8 bg-slate-50">
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
    </div>
  );
}