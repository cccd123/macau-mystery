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
    setTimeout(() => {
      onChoose(id);
      setSelected(null);
    }, 500);
  };

  return (
    <div className="space-y-2">
      {choices.map((choice) => (
        <Button
          key={choice.id}
          variant={selected === choice.id ? "default" : "outline"}
          className={`w-full text-left justify-start h-auto py-3 px-4 transition-all ${
            selected === choice.id
              ? "bg-primary text-primary-foreground scale-[0.98]"
              : "hover:bg-muted"
          }`}
          onClick={() => handleClick(choice.id)}
          disabled={selected !== null}
        >
          <span className="text-sm">{choice.text}</span>
        </Button>
      ))}
    </div>
  );
}
