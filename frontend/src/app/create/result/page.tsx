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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  BookOpen,
  Share2,
  Send,
  Eye,
  EyeOff,
  Loader2,
  Info,
  Play,
  Sparkles,
} from "lucide-react";
import { ugcApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

interface GeneratedScript {
  script_id: string;
  title: string;
  chapters: any[];
  style: string;
  era: string;
  demo_mode?: boolean;
}

function IdealPlayerDemo({ script }: { script: GeneratedScript }) {
  const [playing, setPlaying] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [clueShown, setClueShown] = useState(false);

  const firstChapter = script.chapters?.[0];
  const firstScene = firstChapter?.scenes?.[0];
  const choices = firstScene?.choices || [];

  const startDemo = () => {
    setPlaying(true);
    setShowChoices(false);
    setClueShown(false);
    window.setTimeout(() => {
      setPlaying(false);
      setShowChoices(true);
    }, 1600);
  };

  const pickChoice = (index: number) => {
    if (index === 0) setClueShown(true);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center border shadow-lg">
        {!playing && !showChoices && (
          <button
            onClick={startDemo}
            className="flex flex-col items-center gap-3 text-white hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Play className="h-8 w-8 fill-white" />
            </div>
            <span className="text-sm font-medium">播放理想效果演示</span>
          </button>
        )}

        {playing && (
          <div className="w-full px-8 text-center">
            <p className="text-white/90 text-sm md:text-base mb-6 line-clamp-3">
              {firstScene?.narration || "视频正在播放中…"}
            </p>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mx-auto max-w-md">
              <div
                className="h-full bg-jade rounded-full"
                style={{
                  width: "0%",
                  transition: "width 1.5s ease-out",
                  animation: "ideal-progress 1.5s linear forwards",
                }}
              />
            </div>
            <style jsx>{`
              @keyframes ideal-progress {
                from { width: 0%; }
                to { width: 100%; }
              }
            `}</style>
          </div>
        )}

        {showChoices && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-white text-base md:text-lg font-medium mb-5">
              视频播放结束，关键抉择浮现
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {choices.length > 0 ? (
                choices.map((choice: any, i: number) => (
                  <Button
                    key={choice.id || i}
                    variant="outline"
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
                    onClick={() => pickChoice(i)}
                  >
                    {choice.text}
                  </Button>
                ))
              ) : (
                <span className="text-white/70 text-sm">暂无选项</span>
              )}
            </div>
            {clueShown && (
              <div className="mt-5 flex items-center gap-2 text-amber-300 bg-amber-950/40 border border-amber-500/40 px-4 py-2 rounded-full text-sm animate-bounce">
                <Sparkles className="h-4 w-4" />
                <span>线索已解锁：古籍残页</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          未来优化效果说明
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>末帧保持：视频结束后画面保持最后一帧，不会黑屏。</li>
          <li>选项覆盖层：关键抉择以覆盖层形式直接浮现在视频上方。</li>
          <li>线索动画：选择后即时以动效反馈已获得的线索。</li>
          <li>预加载：选择悬停或确认后，后台静默预载下一段视频。</li>
        </ul>
      </div>
    </div>
  );
}

export default function CreateResultPage() {
  const { t } = useTranslation();
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [published, setPublished] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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
          <p className="text-muted-foreground mb-4">{t("result.noScript")}</p>
          <Link href="/create">
            <Button>{t("result.createNew")}</Button>
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
          ID: {script.script_id} | {script.chapters?.length || 0} {t("admin.chapters")}
        </p>
      </div>

      {/* Demo mode notice */}
      {script.demo_mode && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-6 text-sm text-amber-700 dark:text-amber-400">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{t("create.demoNotice")}</span>
        </div>
      )}

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
                {ch.scenes?.length || 0} {t("result.scenes")} |{" "}
                {ch.scenes?.[0]?.choices?.length || 0} {t("result.choices")}
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
            {t("result.regenerate")}
          </Button>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger
              render={
                <Button className="flex-1 gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t("result.previewStructure")}
                </Button>
              }
            />
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{script.title}</DialogTitle>
                <DialogDescription>{t("result.previewStructure")}</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="structure" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="structure">{t("result.previewStructure")}</TabsTrigger>
                  <TabsTrigger value="ideal">{t("result.idealPreview")}</TabsTrigger>
                </TabsList>
                <TabsContent value="structure" className="space-y-4 mt-4">
                  {script.chapters?.map((ch: any, i: number) => (
                    <div key={ch.id || i} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">
                        {i + 1}. {ch.title}
                      </h3>
                      {ch.scenes?.[0] && (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">
                            {ch.scenes[0].narration}
                          </p>
                          {ch.scenes[0].dialogue && (
                            <div className="bg-muted rounded p-2 mb-2 text-sm">
                              <span className="font-medium">{ch.scenes[0].dialogue.npc}:</span>{" "}
                              {ch.scenes[0].dialogue.text}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {ch.scenes[0].choices?.map((choice: any) => (
                              <Badge key={choice.id} variant="outline">
                                {choice.text}
                              </Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="ideal" className="mt-4">
                  <IdealPlayerDemo script={script} />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Publish Controls */}
        {!published ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("result.publishTitle")}</CardTitle>
              <CardDescription>
                {t("result.publishDesc")}
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
                    {isPublic ? t("common.public") : t("common.private")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPublic(!isPublic)}
                >
                  {isPublic ? t("common.private") : t("common.public")}
                </Button>
              </div>
              <Button className="w-full gap-2" onClick={handlePublish}>
                <Share2 className="h-4 w-4" />
                {t("result.publish")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">{t("result.published")}</span>
                <Badge variant="outline">
                  {isPublic ? t("common.public") : t("common.private")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("result.views")}: 0 | {t("result.plays")}: 0
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
                    ? t("result.submitOfficial")
                    : t("result.makePublic")}
                </Button>
              ) : (
                <div className="text-center text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                  {t("result.submitted")}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
