
"use client";
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface FileExplorerProps {
  files: Record<string, string>;
  onFileChange: (fileName: string, newContent: string) => void;
}

export default function FileExplorer({ files, onFileChange }: FileExplorerProps) {
  const fileNames = Object.keys(files);
  const [activeFile, setActiveFile] = useState<string>(fileNames[0] || "");

  // Auto-select the first file if the files change
  useEffect(() => {
    if (fileNames.length > 0 && !fileNames.includes(activeFile)) {
      setActiveFile(fileNames[0]);
    }
  }, [files, activeFile, fileNames]);

  if (fileNames.length === 0) {
    return <div className="p-4 text-slate-500 font-mono text-sm">No files generated yet.</div>;
  }

  const fileExtension = activeFile.split('.').pop() || '';
  let language = 'plaintext';
  if (fileExtension === 'js' || fileExtension === 'jsx') language = 'javascript';
  else if (fileExtension === 'ts' || fileExtension === 'tsx') language = 'typescript';
  else if (fileExtension === 'html') language = 'html';
  else if (fileExtension === 'css') language = 'css';
  else if (fileExtension === 'json') language = 'json';
  else if (fileExtension === 'py') language = 'python';

  return (
    <div className="flex h-full border border-slate-200 rounded-lg overflow-hidden bg-[#1e1e1e]">
      {/* Sidebar */}
      <div className="w-48 border-r border-[#333333] bg-[#252526] flex flex-col">
        <div className="p-2 bg-[#2d2d2d] border-b border-[#333333] text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Explorer
        </div>
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
          {fileNames.map(name => (
            <button
              key={name}
              onClick={() => setActiveFile(name)}
              className={`w-full text-left px-3 py-1 text-sm font-mono truncate transition-colors ${
                activeFile === name ? 'bg-[#37373d] text-blue-400' : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 bg-[#1e1e1e] text-slate-400 text-sm font-mono flex justify-between items-center shadow-sm z-10">
           <span>{activeFile}</span>
           <span className="text-xs text-blue-400">Live Sync Active</span>
        </div>
        <div className="flex-1 pt-2">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={files[activeFile] || ""}
            onChange={(value) => onFileChange(activeFile, value || "")}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
            }}
          />
        </div>
      </div>
    </div>
  );
}