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
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0 border">
          <AvatarFallback className="text-lg bg-primary/10">
            {avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{npc}</span>
            {audioUrl && (
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Volume2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-sm leading-relaxed">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
