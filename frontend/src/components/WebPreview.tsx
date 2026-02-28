"use client";
import { useEffect, useState, useRef } from "react";
import { WebContainer } from '@webcontainer/api';

interface WebPreviewProps {
  files: Record<string, string>;
}

// Keep a singleton instance so we don't boot multiple OSs at once
let webcontainerInstance: WebContainer | null = null;

export default function WebPreview({ files }: WebPreviewProps) {
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [bootStatus, setBootStatus] = useState<string>("Initializing OS...");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootAndRun() {
      try {
        // 1. Boot the micro-OS if it hasn't booted yet
        if (!webcontainerInstance) {
          setBootStatus("Booting WebContainer...");
          webcontainerInstance = await WebContainer.boot();
        }

        // 2. Format the AI's files for the WebContainer file system
        const tree: Record<string, any> = {};
        Object.entries(files).forEach(([name, content]) => {
          tree[name] = {
            file: {
              contents: content,
            },
          };
        });

        // Ensure there is always a package.json for the server
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

        // 3. Install dependencies (like 'serve' to host the HTML)
        setBootStatus("Installing dependencies...");
        const installProcess = await webcontainerInstance.spawn('npm', ['install']);
        await installProcess.exit;

        // 4. Start the server
        setBootStatus("Starting local server...");
        await webcontainerInstance.spawn('npm', ['run', 'start']);

        // 5. Listen for the server to announce its URL, then feed it to the iframe
        webcontainerInstance.on('server-ready', (port, url) => {
          if (isMounted) {
            setIframeUrl(url);
            setBootStatus(""); // Clear loading status
          }
        });

      } catch (error) {
        console.error("WebContainer Error:", error);
        if (isMounted) setBootStatus("Failed to boot environment. Check console.");
      }
    }

    if (Object.keys(files).length > 0) {
      bootAndRun();
    }

    return () => {
      isMounted = false;
    };
  }, [files]);

  return (
    <div className="w-full h-full bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col relative">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-2 text-xs text-slate-400 font-mono">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="ml-2">Live WebContainer Environment</span>
      </div>
      
      {bootStatus && (
        <div className="absolute inset-0 top-8 bg-slate-50 flex flex-col items-center justify-center font-mono text-sm text-blue-600 z-10">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            {bootStatus}
        </div>
      )}

      {iframeUrl && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full flex-1 border-none bg-white"
          allow="cross-origin-isolated"
        />
      )}
    </div>
  );
}