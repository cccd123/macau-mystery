"use client";

import { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  autoPlay?: boolean;
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  onEnded,
  onTimeUpdate,
  autoPlay = true,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setError(false);
    setProgress(0);

    if (autoPlay) {
      video.play().catch(() => {
        // autoplay may be blocked until user interaction
        setPlaying(false);
      });
    }
  }, [src, autoPlay]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    onEnded?.();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    setProgress(pct);
    onTimeUpdate?.(video.currentTime, video.duration);
  };

  if (error) {
    return (
      <div
        className={`relative bg-muted rounded-lg overflow-hidden flex items-center justify-center ${className}`}
        style={{ minHeight: 240 }}
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt="scene poster"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            onError={() => setError(true)}
          />
        ) : null}
        <div className="relative z-10 text-center p-6">
          <p className="text-muted-foreground text-sm mb-2">
            Video unavailable
          </p>
          <Button size="sm" variant="secondary" onClick={handlePlay}>
            <Play className="h-4 w-4 mr-1" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-contain bg-black"
        playsInline
        muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onError={() => setError(true)}
      />

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
          onClick={handlePlay}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
          onClick={() => {
            const video = videoRef.current;
            if (video) video.muted = !muted;
            setMuted(!muted);
          }}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
