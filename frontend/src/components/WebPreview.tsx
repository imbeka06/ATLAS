"use client";
import { useEffect, useState } from "react";

interface WebPreviewProps {
  files: Record<string, string>;
}

export default function WebPreview({ files }: WebPreviewProps) {
  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    let html = "";
    let css = "";
    let js = "";

    Object.entries(files).forEach(([name, content]) => {
      const lowerName = name.toLowerCase();
      if (lowerName.endsWith(".html")) html = content;
      else if (lowerName.endsWith(".css")) css += content + "\n";
      else if (lowerName.endsWith(".js") || lowerName.endsWith(".javascript")) js += content + "\n";
    });

    if (!html) {
      html = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; color: #333; background: #f8fafc;">
          <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">No HTML file detected</h2>
          <p style="color: #64748b;">The AI did not generate an HTML file in this response.</p>
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

    setSrcDoc(html);
  }, [files]);

  return (
    <div className="w-full h-full bg-white border border-slate-200 rounded-lg overflow-hidden">
      <iframe
        title="Web Preview"
        srcDoc={srcDoc}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-modals"
      />
    </div>
  );
}