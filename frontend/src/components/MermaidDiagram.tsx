"use client";
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

interface MermaidProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    if (ref.current && chart) {
      const renderDiagram = async () => {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvg(svg);
        } catch (error) {
          console.error(error);
          setSvg("");
        }
      };
      renderDiagram();
    }
  }, [chart]);

  return (
    <div 
      className="flex justify-center p-4 bg-white rounded shadow-sm border border-slate-100 my-4 overflow-auto"
      ref={ref}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}