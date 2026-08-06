"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Clapperboard,
  Loader2,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, gameApi, type GameSnapshot } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

const SESSION_STORAGE_PREFIX = "macau-mystery:game-session:";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sessionStorageKey(storyId: string) {
  return `${SESSION_STORAGE_PREFIX}${storyId}`;
}

function readStoredSession(storyId: string) {
  try {
    return localStorage.getItem(sessionStorageKey(storyId));
  } catch {
    return null;
  }
}

function storeSession(storyId: string, sessionId: string) {
  try {
    localStorage.setItem(sessionStorageKey(storyId), sessionId);
  } catch {
    // A playable session does not depend on localStorage being available.
  }
}

function clearStoredSession(storyId: string) {
  try {
    localStorage.removeItem(sessionStorageKey(storyId));
  } catch {
    // Ignore browsers that disable localStorage.
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export default function GamePage() {
  const { t } = useTranslation();
  const params = useParams<{ sessionId: string }>();
  const routeId = Array.isArray(params.sessionId)
    ? params.sessionId[0]
    : params.sessionId;
  const immersiveRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadedRouteRef = useRef<string | null>(null);
  const requestIdsRef = useRef(new Map<string, string>());
  const autoAdvancedScenesRef = useRef(new Set<string>());

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [actionError, setActionError] = useState("");
  const [choosingId, setChoosingId] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoBuffering, setVideoBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [muted, setMuted] = useState(true);
  const [immersiveStarted, setImmersiveStarted] = useState(false);

  const prepareForSnapshot = useCallback((nextSnapshot: GameSnapshot) => {
    setVideoEnded(false);
    setVideoReady(false);
    setVideoBuffering(false);
    setVideoError(false);
    setActionError("");
    setSnapshot(nextSnapshot);
    storeSession(nextSnapshot.story.id, nextSnapshot.session_id);
  }, []);

  const loadGame = useCallback(
    async (id: string) => {
      setInitialLoading(true);
      setFatalError("");
      autoAdvancedScenesRef.current.clear();

      try {
        let nextSnapshot: GameSnapshot | null = null;

        if (UUID_PATTERN.test(id)) {
          nextSnapshot = await gameApi.getState(id);
        } else {
          const storedSessionId = readStoredSession(id);
          if (storedSessionId) {
            try {
              nextSnapshot = await gameApi.getState(storedSessionId);
              // Opening a story entry after its previous run completed should
              // begin a new run instead of silently restoring the ending scene.
              if (nextSnapshot.status === "completed") {
                clearStoredSession(id);
                nextSnapshot = null;
              }
            } catch (error) {
              if (error instanceof ApiError && error.status === 404) {
                clearStoredSession(id);
              } else {
                throw error;
              }
            }
          }

          if (!nextSnapshot) nextSnapshot = await gameApi.start(id);
        }

        prepareForSnapshot(nextSnapshot);
      } catch (error) {
        setFatalError(errorMessage(error));
      } finally {
        setInitialLoading(false);
      }
    },
    [prepareForSnapshot]
  );

  useEffect(() => {
    if (!routeId || loadedRouteRef.current === routeId) return;
    loadedRouteRef.current = routeId;
    void loadGame(routeId);
  }, [loadGame, routeId]);

  // Warm the browser cache for every possible next scene returned by the API.
  useEffect(() => {
    if (!snapshot) return;

    const preloaders = snapshot.scene.choices.map((choice) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.src = choice.preload.media.video_url;
      video.load();
      return video;
    });

    return () => {
      preloaders.forEach((video) => {
        video.removeAttribute("src");
        video.load();
      });
    };
  }, [snapshot]);

  const handleChoice = useCallback(async (choiceId: string) => {
    if (!snapshot || choosingId) return;

    const requestKey = `${snapshot.scene.id}:${choiceId}`;
    const requestId =
      requestIdsRef.current.get(requestKey) || crypto.randomUUID();
    requestIdsRef.current.set(requestKey, requestId);
    setChoosingId(choiceId);
    setActionError("");

    try {
      const nextSnapshot = await gameApi.makeChoice({
        sessionId: snapshot.session_id,
        sceneId: snapshot.scene.id,
        choiceId,
        requestId,
      });
      requestIdsRef.current.delete(requestKey);
      prepareForSnapshot(nextSnapshot);
    } catch (error) {
      // Keep requestId so retrying an uncertain request is idempotent.
      setActionError(errorMessage(error));
    } finally {
      setChoosingId(null);
    }
  }, [choosingId, prepareForSnapshot, snapshot]);

  useEffect(() => {
    if (
      !videoEnded ||
      !snapshot ||
      snapshot.status !== "active" ||
      choosingId !== null ||
      snapshot.scene.choices.length !== 1
    ) {
      return;
    }

    const [choice] = snapshot.scene.choices;
    if (
      choice.text.trim() !== "继续" ||
      autoAdvancedScenesRef.current.has(snapshot.scene.id)
    ) {
      return;
    }

    autoAdvancedScenesRef.current.add(snapshot.scene.id);
    void handleChoice(choice.id);
  }, [choosingId, handleChoice, snapshot, videoEnded]);

  const startOver = async () => {
    if (!snapshot || choosingId) return;
    setChoosingId("restart");
    setActionError("");
    try {
      const nextSnapshot = await gameApi.start(snapshot.story.id);
      requestIdsRef.current.clear();
      autoAdvancedScenesRef.current.clear();
      prepareForSnapshot(nextSnapshot);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setChoosingId(null);
    }
  };

  const replayVideo = () => {
    if (!videoRef.current) return;
    setVideoEnded(false);
    setVideoError(false);
    videoRef.current.currentTime = 0;
    void videoRef.current.play();
  };

  const retryVideo = () => {
    if (!videoRef.current) return;
    setVideoError(false);
    setVideoReady(false);
    videoRef.current.load();
    void videoRef.current.play();
  };

  const toggleMuted = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
    if (videoRef.current.paused && !videoEnded) void videoRef.current.play();
  };

  const enterImmersiveMode = () => {
    if (!videoRef.current) return;
    setImmersiveStarted(true);
    videoRef.current.muted = false;
    setMuted(false);
    void videoRef.current.play();

    if (immersiveRef.current?.requestFullscreen) {
      void immersiveRef.current.requestFullscreen().catch(() => {
        // The fixed viewport layout remains immersive if browser fullscreen is denied.
      });
    }
  };

  if (initialLoading && !snapshot) {
    return (
      <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin" />
          <p className="text-zinc-300">{t("game.loading")}</p>
        </div>
      </div>
    );
  }

  if (fatalError || !snapshot) {
    return (
      <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="max-w-md text-center">
          <Clapperboard className="mx-auto mb-4 h-10 w-10 text-zinc-500" />
          <h1 className="mb-2 text-xl font-semibold">{t("game.loadFailed")}</h1>
          <p className="mb-6 text-sm text-red-300">{fatalError}</p>
          <Button onClick={() => routeId && void loadGame(routeId)}>
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const showChoices = snapshot.status === "active" && videoEnded;
  const showEnding = snapshot.status === "completed" && videoEnded;

  return (
    <div
      ref={immersiveRef}
      className="fixed inset-0 z-[100] overflow-hidden bg-black text-white"
    >
      <main className="h-full w-full">
        <section className="relative isolate h-full w-full overflow-hidden bg-black">
          <div className="relative h-full w-full">
            <video
              ref={videoRef}
              key={snapshot.scene.id}
              className="h-full w-full bg-black object-contain"
              autoPlay={immersiveStarted}
              muted={muted}
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload nofullscreen noremoteplayback"
              preload="auto"
              poster={snapshot.scene.media.poster_url}
              aria-label={t("game.videoLabel")}
              onCanPlay={() => {
                setVideoReady(true);
                setVideoBuffering(false);
              }}
              onPlaying={() => {
                setVideoReady(true);
                setVideoBuffering(false);
              }}
              onWaiting={() => setVideoBuffering(true)}
              onEnded={() => {
                setVideoEnded(true);
                setVideoBuffering(false);
              }}
              onTimeUpdate={(event) => {
                const { currentTime, duration } = event.currentTarget;
                if (
                  Number.isFinite(duration) &&
                  duration > 0 &&
                  duration - currentTime <= 0.08
                ) {
                  setVideoEnded(true);
                  setVideoBuffering(false);
                }
              }}
              onPause={(event) => {
                const { currentTime, duration, ended } = event.currentTarget;
                if (
                  ended ||
                  (Number.isFinite(duration) &&
                    duration > 0 &&
                    duration - currentTime <= 0.08)
                ) {
                  setVideoEnded(true);
                  setVideoBuffering(false);
                }
              }}
              onError={() => {
                setVideoError(true);
                setVideoBuffering(false);
              }}
              onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
            >
              <source
                src={snapshot.scene.media.video_url}
                type={snapshot.scene.media.mime_type}
              />
              {t("game.videoUnsupported")}
            </video>

            {!immersiveStarted && videoReady && !videoError && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 px-6 text-center backdrop-blur-[2px]">
                <button
                  type="button"
                  className="group flex flex-col items-center text-white outline-none"
                  onClick={enterImmersiveMode}
                >
                  <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-white/15 transition-transform group-hover:scale-105 group-focus-visible:ring-4 group-focus-visible:ring-white/40">
                    <Clapperboard className="h-8 w-8" />
                  </span>
                  <span className="text-xl font-semibold sm:text-2xl">
                    {t("game.enterImmersive")}
                  </span>
                  <span className="mt-2 text-sm text-white/65">
                    {t("game.enterImmersiveHint")}
                  </span>
                </button>
              </div>
            )}

            {(!videoReady || videoBuffering) && !videoError && !videoEnded && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                <Loader2 className="h-8 w-8 animate-spin text-white/80" />
              </div>
            )}

            {videoError && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 px-6 text-center">
                <div>
                  <p className="mb-2 font-medium">{t("game.videoFailed")}</p>
                  <p className="mb-5 max-w-md break-all text-xs text-zinc-400">
                    {snapshot.scene.media.video_url}
                  </p>
                  <Button variant="secondary" onClick={retryVideo}>
                    <RotateCcw className="mr-1 h-4 w-4" />
                    {t("common.retry")}
                  </Button>
                </div>
              </div>
            )}

            {showChoices && (
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-5 pt-16 sm:px-8 sm:pb-8">
                <div className="mx-auto max-w-2xl">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                        {t("game.makeChoice")}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold sm:text-xl">
                        {t("game.whatNext")}
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-300 hover:bg-white/10 hover:text-white"
                      onClick={replayVideo}
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      {t("game.replay")}
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    {snapshot.scene.choices.map((choice, index) => (
                      <Button
                        key={choice.id}
                        variant="secondary"
                        className="h-auto min-h-11 w-full justify-between whitespace-normal px-4 py-3 text-left"
                        disabled={choosingId !== null}
                        onClick={() => void handleChoice(choice.id)}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/10 text-xs">
                            {index + 1}
                          </span>
                          {choice.text}
                        </span>
                        {choosingId === choice.id ? (
                          <Loader2 className="ml-3 h-4 w-4 shrink-0 animate-spin" />
                        ) : (
                          <ArrowRight className="ml-3 h-4 w-4 shrink-0" />
                        )}
                      </Button>
                    ))}
                  </div>
                  {actionError && (
                    <p className="mt-3 text-sm text-red-300" role="alert">
                      {actionError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {showEnding && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 px-5 text-center backdrop-blur-sm">
                <div className="max-w-lg">
                  <Sparkles className="mx-auto mb-4 h-10 w-10 text-amber-300" />
                  <p className="mb-2 text-xs uppercase tracking-[0.25em] text-zinc-400">
                    {t("game.endingReached")}
                  </p>
                  <h2 className="text-2xl font-semibold sm:text-3xl">
                    {t("game.completed")}
                  </h2>
                  {snapshot.ending && (
                    <p className="mt-2 text-sm text-zinc-400">
                      {t("game.endingCode")}: {snapshot.ending.code}
                    </p>
                  )}
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button variant="secondary" onClick={replayVideo}>
                      <RotateCcw className="mr-1 h-4 w-4" />
                      {t("game.replayEnding")}
                    </Button>
                    <Button disabled={choosingId !== null} onClick={() => void startOver()}>
                      {choosingId === "restart" ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Clapperboard className="mr-1 h-4 w-4" />
                      )}
                      {t("game.startOver")}
                    </Button>
                  </div>
                  <Link
                    href="/"
                    className="mt-5 inline-block text-sm text-zinc-400 underline-offset-4 hover:text-white hover:underline"
                  >
                    {t("game.backHome")}
                  </Link>
                  {actionError && (
                    <p className="mt-3 text-sm text-red-300" role="alert">
                      {actionError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {immersiveStarted && (
              <div className="absolute right-3 top-3 z-30 opacity-40 transition-opacity hover:opacity-100 focus-within:opacity-100">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full border border-white/15 bg-black/50 text-white hover:bg-black/75"
                aria-label={muted ? t("game.unmute") : t("game.mute")}
                onClick={toggleMuted}
              >
                {muted ? <VolumeX /> : <Volume2 />}
              </Button>
              </div>
            )}

            {snapshot.awarded_clues && snapshot.awarded_clues.length > 0 && (
              <div className="absolute left-3 top-3 z-30 rounded-lg border border-amber-300/30 bg-black/75 px-3 py-2 text-sm shadow-lg backdrop-blur">
                <span className="text-amber-300">{t("game.clueFound")}</span>{" "}
                {snapshot.awarded_clues.map((clue) => clue.title).join("、")}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
