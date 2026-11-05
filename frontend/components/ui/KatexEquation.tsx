"use client";

import React, { useEffect, useRef } from "react";
import katex from "katex";

interface KatexEquationProps {
  math: string;
  block?: boolean;
  className?: string;
}

export default function KatexEquation({
  math,
  block = false,
  className = "",
}: KatexEquationProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
        });
      } catch (err) {
        console.error("KaTeX rendering error:", err);
      }
    }
  }, [math, block]);

  return (
    <span
      ref={containerRef}
      className={`inline-block ${block ? "my-3 overflow-x-auto max-w-full text-center" : ""} ${className}`}
    />
  );
}

