"use client";
import { useEffect, useState, useRef } from "react";
import { WebContainer } from '@webcontainer/api';

interface WebPreviewProps {
  files: Record<string, string>;
}

let webcontainerInstance: WebContainer | null = null;

export default function WebPreview({ files }: WebPreviewProps) {
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [bootStatus, setBootStatus] = useState<string>("Initializing...");
  const [useFallback, setUseFallback] = useState<boolean>(false);
  const [fallbackDoc, setFallbackDoc] = useState<string>("");

  // Boot WebContainer Logic
  useEffect(() => {
    let isMounted = true;

    async function bootAndRun() {
      try {
        // Browser security check
        if (typeof SharedArrayBuffer === 'undefined') {
          throw new Error("SharedArrayBuffer blocked by browser security.");
        }

        if (!webcontainerInstance) {
          setBootStatus("Booting Engine...");
          webcontainerInstance = await WebContainer.boot();
        }

        const tree: Record<string, any> = {};
        Object.entries(files).forEach(([name, content]) => {
          tree[name] = { file: { contents: content } };
        });

        if (!tree['package.json']) {
            tree['package.json'] = {
                file: {
                    contents: JSON.stringify({
                        name: "atlas-preview",
                        scripts: { start: "serve ." },
                        dependencies: { serve: "^14.0.0" }
                    })
                }
            }
        }

        setBootStatus("Mounting files...");
        await webcontainerInstance.mount(tree);

        setBootStatus("Installing dependencies...");
        const installProcess = await webcontainerInstance.spawn('npm', ['install']);
        await installProcess.exit;

        setBootStatus("Starting server...");
        await webcontainerInstance.spawn('npm', ['run', 'start']);

        webcontainerInstance.on('server-ready', (port, url) => {
          if (isMounted) {
            setIframeUrl(url);
            setBootStatus(""); 
          }
        });

      } catch (error) {
        console.warn("WebContainer boot failed, switching to Safe Fallback Mode:", error);
        if (isMounted) {
            setUseFallback(true);
        }
      }
    }

    if (Object.keys(files).length > 0 && !useFallback) {
      bootAndRun();
    }

    return () => { isMounted = false; };
  }, [files, useFallback]);

  // Safe Fallback Logic (Runs if WebContainer fails)
  useEffect(() => {
    if (!useFallback) return;

    let html = "";
    let css = "";
    let js = "";

    Object.entries(files).forEach(([name, content]) => {
      const lowerName = name.toLowerCase();
      if (lowerName.endsWith(".html")) html = content;
      else if (lowerName.endsWith(".css")) css += content + "\n";
      else if (lowerName.endsWith(".js") || lowerName.endsWith(".jsx")) js += content + "\n";
    });

    if (!html) {
        setFallbackDoc(`
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #f8fafc;">
          <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #333;">Preview Not Available</h2>
          <p style="color: #64748b;">No HTML code was found to render.</p>
        </div>
      `);
      return;
    }

    if (css) {
        if (html.includes("</head>")) html = html.replace("</head>", `<style>\n${css}\n</style>\n</head>`);
        else html += `<style>\n${css}\n</style>`;
    }
    if (js) {
        if (html.includes("</body>")) html = html.replace("</body>", `<script>\n${js}\n</script>\n</body>`);
        else html += `<script>\n${js}\n</script>`;
    }

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setFallbackDoc(url);

    return () => URL.revokeObjectURL(url);
  }, [files, useFallback]);

  return (
    <div className="w-full h-full bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col relative">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="ml-2">{useFallback ? "Live Browser Preview (Safe Mode)" : "Live WebContainer Environment"}</span>
        </div>
      </div>
      
      {!useFallback && bootStatus && (
        <div className="absolute inset-0 top-8 bg-slate-50 flex flex-col items-center justify-center font-mono text-sm text-blue-600 z-10">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            {bootStatus}
        </div>
      )}

      {(!useFallback && iframeUrl) && (
        <iframe src={iframeUrl} className="w-full flex-1 border-none bg-white" allow="cross-origin-isolated" />
      )}

      {(useFallback && fallbackDoc) && (
        <iframe src={fallbackDoc} className="w-full flex-1 border-none bg-white" sandbox="allow-scripts allow-modals allow-same-origin allow-forms" />
      )}
    </div>
  );
}