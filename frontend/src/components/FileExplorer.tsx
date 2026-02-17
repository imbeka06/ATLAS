"use client";
import { useState } from "react";
import { Folder, FileCode, ChevronRight, ChevronDown } from "lucide-react";

interface FileExplorerProps {
  files: Record<string, string>;
}

export default function FileExplorer({ files }: FileExplorerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(Object.keys(files)[0] || null);
  const [expanded, setExpanded] = useState<boolean>(true);

  return (
    <div className="flex h-full border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-3 border-b border-slate-200 font-medium text-sm text-slate-600 flex items-center gap-2">
            <Folder size={16} />
            <span>Project Structure</span>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
            {Object.keys(files).map((fileName) => (
                <button
                    key={fileName}
                    onClick={() => setSelectedFile(fileName)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 mb-1 ${
                        selectedFile === fileName 
                        ? "bg-blue-100 text-blue-700 font-medium" 
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                    <FileCode size={14} />
                    {fileName}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#1e1e1e] text-slate-300">
        <div className="px-4 py-2 bg-[#2d2d2d] text-xs text-slate-400 border-b border-[#333]">
            {selectedFile || "Select a file"}
        </div>
        <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            <pre>
                <code>{selectedFile ? files[selectedFile] : "// No file selected"}</code>
            </pre>
        </div>
      </div>
    </div>
  );
}