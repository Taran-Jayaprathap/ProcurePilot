"use client";

import { useEffect, useState } from "react";

type AiTypingProps = {
  text: string;
  className?: string;
};

export function AiTyping({ text, className }: AiTypingProps) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    setVisibleText("");
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, 18);

    return () => window.clearInterval(interval);
  }, [text]);

  return (
    <p className={className}>
      {visibleText}
      <span className="ml-1 inline-block h-5 w-2 animate-pulse rounded-sm bg-cyan-200 align-middle" />
    </p>
  );
}
