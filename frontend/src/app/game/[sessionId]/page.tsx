"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Package, Loader2, Play, Flag } from "lucide-react";
import Link from "next/link";
import { gameApi, type GameSnapshot, type GameChoice } from "@/lib/api";
import { VideoPlayer } from "@/components/video-player";
import { useTranslation } from "@/lib/i18n/context";

export default function GamePage() {
  const params = useParams();
  const { t } = useTranslation();
  const sessionId = params.sessionId as string;

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChoices, setShowChoices] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    loadGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGame = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await gameApi.getState(sessionId);
      setSnapshot(res);
      setVideoEnded(false);
      setShowChoices(false);
    } catch (e: any) {
      setError(t("common.retry") + ": " + e.message);
    }
    setLoading(false);
  };

  const handleChoice = async (choice: GameChoice) => {
    if (!snapshot) return;
    setLoading(true);
    try {
      const res = await gameApi.makeChoice(
        snapshot.session_id,
        snapshot.scene.id,
        choice.id
      );
      setSnapshot(res);
      setVideoEnded(false);
      setShowChoices(false);
    } catch (e: any) {
      setError(t("common.retry") + ": " + e.message);
    }
    setLoading(false);
  };

  const handleVideoEnded = () => {
    setVideoEnded(true);
    if (snapshot?.scene.choices.length) {
      setShowChoices(true);
    }
  };

  if (loading && !snapshot) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t("game.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadGame}>{t("common.retry")}</Button>
        </div>
      </div>
    );
  }

  if (!snapshot) return null;

  const { scene, clues, progress, status, ending } = snapshot;
  const isEnding = scene.type === "ending" || status === "completed" || ending;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{scene.chapter.title}</Badge>
          <span className="text-sm text-muted-foreground">{scene.chapter.location}</span>
          {clues.length > 0 && (
            <Badge variant="secondary">
              {clues.length} {t("game.clues")}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {progress.current_chapter}/{progress.total_chapters}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 gap-4">
        {/* Video / Ending scene */}
        <VideoPlayer
          src={scene.media.video_url}
          poster={scene.media.poster_url}
          onEnded={handleVideoEnded}
          autoPlay
          className="w-full"
        />

        {/* Scene title */}
        <div className="text-center">
          <h2 className="text-lg font-semibold">{scene.chapter.title}</h2>
          <p className="text-sm text-muted-foreground">{scene.chapter.location}</p>
        </div>

        {/* Choices or ending */}
        {isEnding || (videoEnded && scene.choices.length === 0) ? (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <Flag className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="text-xl font-bold mb-2">{t("game.endingTitle")}</h3>
            <p className="text-muted-foreground mb-4">{t("game.endingDesc")}</p>
            <Link href="/">
              <Button>{t("game.backHome")}</Button>
            </Link>
          </div>
        ) : showChoices || scene.choices.length > 0 ? (
          <div className="space-y-3">
            {!showChoices && !videoEnded && (
              <div className="text-center">
                <Button onClick={() => setShowChoices(true)}>
                  <Play className="h-4 w-4 mr-2" />
                  {t("game.showChoices")}
                </Button>
              </div>
            )}
            {showChoices && (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  {t("game.choosePrompt")}
                </p>
                <div className="grid gap-3">
                  {scene.choices.map((choice) => (
                    <Button
                      key={choice.id}
                      variant="outline"
                      className="h-auto py-4 px-6 justify-start text-left whitespace-normal"
                      onClick={() => handleChoice(choice)}
                      disabled={loading}
                    >
                      {choice.text}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}

        {loading && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
