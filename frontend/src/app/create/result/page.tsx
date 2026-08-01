"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Play,
  Share2,
  Send,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { ugcApi } from "@/lib/api";

interface GeneratedScript {
  script_id: string;
  title: string;
  chapters: any[];
  style: string;
  era: string;
}

export default function CreateResultPage() {
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [published, setPublished] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("generatedScript");
    if (stored) {
      setScript(JSON.parse(stored));
    }
  }, []);

  const handleRegenerate = async () => {
    if (!script) return;
    setRegenerating(true);
    try {
      const res = await ugcApi.regenerate(script.script_id);
      setScript(res);
      sessionStorage.setItem("generatedScript", JSON.stringify(res));
    } catch (e) {
      console.error("Regenerate failed:", e);
    }
    setRegenerating(false);
  };

  const handlePublish = () => {
    setPublished(true);
  };

  const handleSubmitToOfficial = async () => {
    setSubmitting(true);
    // TODO: call API to submit to official review
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitted(true);
    setSubmitting(false);
  };

  if (!script) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No script found</p>
          <Link href="/create">
            <Button>Create New</Button>
          </Link>
        </div>
      </div>
    );
  }

  const styleLabels: Record<string, string> = {
    suspense: "悬疑",
    romance: "爱情",
    comedy: "喜剧",
    tragedy: "悲剧",
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-3">
          {styleLabels[script.style] || script.style}
        </Badge>
        <h1 className="text-2xl font-bold mb-2">{script.title}</h1>
        <p className="text-sm text-muted-foreground">
          ID: {script.script_id} | {script.chapters?.length || 0} chapters
        </p>
      </div>

      {/* Script Preview Card */}
      <div className="space-y-3 mb-8">
        {script.chapters?.map((ch: any, i: number) => (
          <Card key={ch.id || i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{ch.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {ch.scenes?.[0] && (
                <p className="line-clamp-3">{ch.scenes[0].narration}</p>
              )}
              <p className="text-xs mt-2">
                {ch.scenes?.length || 0} scenes |{" "}
                {ch.scenes?.[0]?.choices?.length || 0} choices
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Regenerate
          </Button>
          <Link href={`/game/${script.script_id}`} className="flex-1">
            <Button className="w-full gap-2">
              <Play className="h-4 w-4" />
              Play with Engine
            </Button>
          </Link>
        </div>

        {/* Publish Controls */}
        {!published ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Publish Settings</CardTitle>
              <CardDescription>
                Choose visibility before publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {isPublic ? "Public (everyone can see)" : "Private (only you)"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPublic(!isPublic)}
                >
                  Toggle
                </Button>
              </div>
              <Button className="w-full gap-2" onClick={handlePublish}>
                <Share2 className="h-4 w-4" />
                Publish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">Published!</span>
                <Badge variant="outline">
                  {isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Views: 0 | Plays: 0
              </p>

              {/* Submit to Official */}
              {!submitted ? (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleSubmitToOfficial}
                  disabled={submitting || !isPublic}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isPublic
                    ? "Submit to Official (for review & reward)"
                    : "Make public first to submit"}
                </Button>
              ) : (
                <div className="text-center text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                  Submitted for review! Admin will notify you if adopted.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
