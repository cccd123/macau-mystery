"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, MapPin, Play, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { gameApi, StoryInfo } from "@/lib/api";

export default function GameSelectPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [stories, setStories] = useState<StoryInfo[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    gameApi
      .getStories()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setStories(list);
        // Default to the story with exactly 4 locations if available.
        const four = list.find((s) => s.chapters.length === 4);
        setSelectedSlug(four?.slug || list[0]?.slug || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const current = useMemo(
    () => stories.find((s) => s.slug === selectedSlug),
    [stories, selectedSlug]
  );

  const handleStart = async () => {
    if (!current) return;
    setStarting(true);
    setError("");
    try {
      const snapshot = await gameApi.start(current.slug);
      router.push(`/game/${snapshot.session_id}`);
    } catch (e: any) {
      setError(e.message || t("create.error"));
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3">{t("gameSelect.title")}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {t("gameSelect.subtitle")}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {stories.map((story) => {
          const active = story.slug === selectedSlug;
          return (
            <Card
              key={story.slug}
              className={`cursor-pointer transition-all duration-300 border-2 ${
                active
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-transparent hover:border-primary/30 hover:bg-muted/30"
              }`}
              onClick={() => setSelectedSlug(story.slug)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{story.title}</span>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {story.description || t("gameSelect.noDescription")}
                    </CardDescription>
                  </div>
                  {active && (
                    <Badge variant="default" className="shrink-0">
                      {t("gameSelect.selected")}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-jade" />
                    {story.chapters.length} {t("admin.locations")}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {story.chapters.slice(0, 6).map((ch) => (
                    <Badge key={ch.id} variant="outline" className="text-xs font-normal">
                      {ch.location}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {current && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {current.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("gameSelect.routePrefix")}: {current.chapters.map((c) => c.location).join(" → ")}
                </p>
              </div>
              <Button
                size="lg"
                className="gap-2 shrink-0 btn-shimmer"
                onClick={handleStart}
                disabled={starting}
              >
                {starting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                {starting ? t("gameSelect.starting") : t("gameSelect.startBtn")}
                {!starting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
