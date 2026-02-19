"use client";
import { useEffect, useState } from "react";

interface WebPreviewProps {
  files: Record<string, string>;
}

export default function WebPreview({ files }: WebPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    let html = "";
    let css = "";
    let js = "";

    Object.entries(files).forEach(([name, content]) => {
      const lowerName = name.toLowerCase();
      const lowerContent = content.toLowerCase();

      if (lowerName.endsWith(".html") || lowerContent.includes("<!doctype html>") || lowerContent.includes("<html")) {
        html += content + "\n";
      } else if (lowerName.endsWith(".css") || (!lowerContent.includes("<html") && (lowerContent.includes("margin:") || lowerContent.includes("padding:")))) {
        css += content + "\n";
      } else if (lowerName.endsWith(".js") || lowerName.endsWith(".javascript") || (!lowerContent.includes("<html") && lowerContent.includes("document."))) {
        js += content + "\n";
      }
    });

    if (!html) {
      html = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #f8fafc;">
          <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #333;">Preview Not Available</h2>
          <p style="color: #64748b;">No HTML code was found in the response.</p>
        </div>
      `;
    } else {
        if (css) {
            if (html.includes("</head>")) {
                html = html.replace("</head>", `<style>\n${css}\n</style>\n</head>`);
            } else {
                html += `<style>\n${css}\n</style>`;
            }
        }
        if (js) {
            if (html.includes("</body>")) {
                html = html.replace("</body>", `<script>\n${js}\n</script>\n</body>`);
            } else {
                html += `<script>\n${js}\n</script>`;
            }
        }
    }

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [files]);

  return (
    <div className="w-full h-full bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-2 text-xs text-slate-400 font-mono">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="ml-2">Live Browser Preview</span>
      </div>
      <iframe
        title="Web Preview"
        src={blobUrl}
        className="w-full flex-1 border-none bg-white"
        sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
      />
    </div>
  );
}