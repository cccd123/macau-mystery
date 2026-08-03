"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Map, Package, Volume2, VolumeX } from "lucide-react";

import { ChoicePanel } from "@/components/choice-panel";
import { DialogueBox } from "@/components/dialogue-box";
import { SceneIllustration } from "@/components/scene-illustration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { gameApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

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
  const scriptId = sessionId === "demo" ? "macau_mystery_01" : sessionId;
  const { t } = useTranslation();
  const [scene, setScene] = useState<Scene | null>(null);
  const [actualSessionId, setActualSessionId] = useState("");
  const [audioOn, setAudioOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clues, setClues] = useState<string[]>([]);

  const loadGame = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await gameApi.start(scriptId);
      setActualSessionId(res.sessionId);
      setScene(res.scene);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(`${t("game.loadError")}：${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    gameApi
      .start(scriptId)
      .then((res) => {
        if (cancelled) return;
        setActualSessionId(res.sessionId);
        setScene(res.scene);
      })
      .catch((cause) => {
        if (cancelled) return;
        const message = cause instanceof Error ? cause.message : String(cause);
        setError(`${t("game.loadError")}：${message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scriptId, t]);

  const handleChoice = async (choiceId: string) => {
    if (!actualSessionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await gameApi.makeChoice(actualSessionId, choiceId);
      setScene(res.scene);
      if (res.clue) {
        setClues((previous) =>
          previous.includes(res.clue!.id)
            ? previous
            : [...previous, res.clue!.id]
        );
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(`${t("game.choiceError")}：${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !scene) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#071f22] text-[#edf6f2]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 size-8 animate-spin text-[#e2b45e] motion-reduce:animate-none" />
          <p className="text-sm text-[#acc3bd]">{t("game.loading")}</p>
        </div>
      </div>
    );
  }

  if (error && !scene) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-5">
        <div className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-lg">
          <p className="mb-4 text-sm leading-6 text-destructive">{error}</p>
          <Button onClick={() => void loadGame()}>{t("common.retry")}</Button>
        </div>
      </div>
    );
  }

  if (!scene) return null;

  const sceneAlt = t("game.sceneImageAlt").replace("{location}", scene.location);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#071f22] text-[#edf6f2]">
      <div className="border-b border-white/10 bg-[#0a292b]/95 px-4 py-2.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Badge className="shrink-0 border-[#d7aa54]/35 bg-[#d7aa54]/12 text-[#f0c878]">
              {scene.chapter}
            </Badge>
            <span className="truncate text-sm text-[#c8d8d4]">{scene.location}</span>
            {clues.length > 0 && (
              <Badge className="hidden border-white/10 bg-white/8 text-[#d8e6e2] sm:inline-flex">
                {clues.length} {t("game.clues")}
              </Badge>
            )}
          </div>
          <nav className="flex shrink-0 items-center gap-1" aria-label={t("game.tools")}>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#cfe0dc] hover:bg-white/10 hover:text-white"
              onClick={() => setAudioOn((value) => !value)}
              aria-label={audioOn ? t("game.audioOff") : t("game.audioOn")}
              title={audioOn ? t("game.audioOff") : t("game.audioOn")}
            >
              {audioOn ? <Volume2 /> : <VolumeX />}
            </Button>
            <Button
              render={<Link href="/game/map" />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              className="text-[#cfe0dc] hover:bg-white/10 hover:text-white"
              aria-label={t("game.openMap")}
              title={t("game.openMap")}
            >
              <Map />
            </Button>
            <Button
              render={<Link href="/game/clues" />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              className="text-[#cfe0dc] hover:bg-white/10 hover:text-white"
              aria-label={t("game.openClues")}
              title={t("game.openClues")}
            >
              <Package />
            </Button>
          </nav>
        </div>
      </div>

      <div
        className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)] lg:gap-6 lg:px-6 lg:py-7"
        aria-busy={loading}
      >
        <section className="min-w-0">
          <div className="relative">
            <SceneIllustration
              location={scene.location}
              sceneKey={scene.id}
              alt={sceneAlt}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[1.75rem] bg-[#061b1d]/55 backdrop-blur-[2px]">
                <Loader2 className="size-8 animate-spin text-[#efc675] motion-reduce:animate-none" />
                <span className="sr-only">{t("common.loading")}</span>
              </div>
            )}
          </div>

          <div
            key={`${scene.id}-narration`}
            className="scene-dossier relative z-10 mx-3 -mt-10 rounded-2xl border border-white/10 bg-[#0d2a2c]/94 px-5 py-4 shadow-[0_22px_60px_-34px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:mx-6 sm:px-6"
          >
            <p className="mb-1.5 text-[0.68rem] font-bold tracking-[0.24em] text-[#d6aa55] uppercase">
              {t("game.narration")}
            </p>
            <p className="text-sm leading-7 text-[#dfeae6] sm:text-[0.95rem]">
              {scene.narration}
            </p>
          </div>
        </section>

        <section
          key={`${scene.id}-dossier`}
          className="scene-dossier flex min-w-0 flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[#091f21]/72 p-3.5 shadow-[0_30px_90px_-52px_rgba(0,0,0,1)] sm:p-4 lg:self-start"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 px-1 pt-1">
            <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
            <span className="text-[0.66rem] font-semibold tracking-[0.2em] text-[#a7beb8] uppercase">
              {t("game.caseDialogue")}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
          </div>
          <DialogueBox
            npc={scene.dialogue.npc}
            avatar={scene.dialogue.avatar || "👤"}
            text={scene.dialogue.text}
          />
          <div>
            <p className="mb-2.5 px-1 text-xs font-medium text-[#b7cbc6]">
              {t("game.chooseAction")}
            </p>
            <ChoicePanel
              choices={scene.choices.map((choice) => ({
                id: choice.id,
                text: choice.text,
              }))}
              onChoose={handleChoice}
            />
          </div>
          {error && (
            <div className="rounded-xl border border-[#e18a7f]/35 bg-[#e18a7f]/10 px-4 py-3 text-sm text-[#ffc1b9]">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
