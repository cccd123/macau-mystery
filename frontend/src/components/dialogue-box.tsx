"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

interface DialogueBoxProps {
  npc: string;
  avatar: string;
  text: string;
  audioUrl?: string;
}

export function DialogueBox({ npc, avatar, text, audioUrl }: DialogueBoxProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#102e30]/92 p-4 text-[#f1f6f2] shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0 border border-[#cf9c43]/45">
          <AvatarFallback className="bg-[#d6ece6] text-lg text-[#103f38]">
            {avatar}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-[#efc675]">{npc}</span>
            {audioUrl && (
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Volume2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <TypewriterText key={text} text={text} />
        </div>
      </div>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [visibleCharacters, setVisibleCharacters] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? text.length
      : 0
  );
  const isTyping = visibleCharacters < text.length;

  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => {
      setVisibleCharacters((count) => {
        if (count + 1 >= text.length) clearInterval(interval);
        return Math.min(count + 1, text.length);
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isTyping, text.length]);

  return (
    <p className="text-[0.95rem] leading-7 text-[#eef5f1]">
      {text.slice(0, visibleCharacters)}
      {isTyping && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#efc675] motion-reduce:animate-none" />
      )}
    </p>
  );
}
