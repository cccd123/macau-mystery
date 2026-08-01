"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DialogueBox } from "@/components/dialogue-box";
import { ChoicePanel } from "@/components/choice-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Package, Volume2, VolumeX, Loader2 } from "lucide-react";
import Link from "next/link";
import { gameApi } from "@/lib/api";

interface Choice {
  id: string;
  text: string;
  nextScene?: string;
  clueReward?: string;
}

interface Scene {
  id: string;
  chapter: string;
  location: string;
  narration: string;
  dialogue: { npc: string; avatar?: string; text: string };
  choices: Choice[];
}

export default function GamePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [scene, setScene] = useState<Scene | null>(null);
  const [actualSessionId, setActualSessionId] = useState<string>("");
  const [audioOn, setAudioOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clues, setClues] = useState<string[]>([]);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await gameApi.start(sessionId);
      setActualSessionId(res.sessionId);
      setScene(res.scene);
    } catch (e: any) {
      setError("Failed: " + e.message);
    }
    setLoading(false);
  };

  const handleChoice = async (choiceId: string) => {
    if (!actualSessionId) return;
    setLoading(true);
    try {
      const res = await gameApi.makeChoice(actualSessionId, choiceId);
      setScene(res.scene);
      if (res.clue) setClues((prev) => [...prev, res.clue!.id]);
    } catch (e: any) {
      setError("Choice failed: " + e.message);
    }
    setLoading(false);
  };

  if (loading && !scene) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadGame}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!scene) return null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="border-b bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{scene.chapter}</Badge>
          <span className="text-sm text-muted-foreground">{scene.location}</span>
          {clues.length > 0 && (
            <Badge variant="secondary">{clues.length} clues</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAudioOn(!audioOn)}
          >
            {audioOn ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          <Link href="/game/map">
            <Button variant="ghost" size="icon">
              <Map className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/game/clues">
            <Button variant="ghost" size="icon">
              <Package className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-end max-w-2xl mx-auto w-full p-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed">
          {scene.narration}
        </div>
        <DialogueBox
          npc={scene.dialogue.npc}
          avatar={scene.dialogue.avatar || "👤"}
          text={scene.dialogue.text}
        />
        <ChoicePanel
          choices={scene.choices.map((c) => ({ id: c.id, text: c.text }))}
          onChoose={handleChoice}
        />
        {loading && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
