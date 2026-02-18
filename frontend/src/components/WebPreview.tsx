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
      if (name.endsWith(".html")) html = content;
      else if (name.endsWith(".css")) css += content + "\n";
      else if (name.endsWith(".js") || name.endsWith(".javascript")) js += content + "\n";
    });

    if (!html) {
      html = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; color: #666;">
          <h2>No HTML file found to preview.</h2>
        </div>
      `;
    } else {
        if (css) {
            html = html.replace("</head>", `<style>\n${css}\n</style>\n</head>`);
            if (html === html.replace("</head>", "")) {
                html += `<style>\n${css}\n</style>`;
            }
        }
        if (js) {
            html = html.replace("</body>", `<script>\n${js}\n</script>\n</body>`);
            if (html === html.replace("</body>", "")) {
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