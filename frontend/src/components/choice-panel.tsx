"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Choice {
  id: string;
  text: string;
}

interface ChoicePanelProps {
  choices: Choice[];
  onChoose: (id: string) => void;
}

export function ChoicePanel({ choices, onChoose }: ChoicePanelProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (id: string) => {
    setSelected(id);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 320;
    setTimeout(() => {
      onChoose(id);
      setSelected(null);
    }, delay);
  };

  return (
    <div className="space-y-2.5">
      {choices.map((choice, index) => (
        <Button
          key={choice.id}
          variant={selected === choice.id ? "default" : "outline"}
          className={`group min-h-12 h-auto w-full justify-start rounded-xl border px-3.5 py-3 text-left whitespace-normal transition-all duration-300 motion-reduce:transition-none ${
            selected === choice.id
              ? "scale-[0.985] border-[#d6a84e] bg-[#d6a84e] text-[#112c29]"
              : "border-white/12 bg-white/[0.045] text-[#edf5f1] hover:border-[#d6a84e]/60 hover:bg-white/[0.09]"
          }`}
          onClick={() => handleClick(choice.id)}
          disabled={selected !== null}
        >
          <span className="mr-3 flex size-7 shrink-0 items-center justify-center rounded-full border border-current/25 font-mono text-xs font-bold opacity-80">
            {String.fromCharCode(65 + index)}
          </span>
          <span className="text-sm leading-5">{choice.text}</span>
        </Button>
      ))}
    </div>
  );
}
