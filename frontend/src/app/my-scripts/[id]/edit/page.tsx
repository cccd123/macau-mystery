"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, Share2 } from "lucide-react";
import { ugcApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

export default function EditMyScriptPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const scriptId = params.id as string;

  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ugcApi
      .getMyScript(scriptId)
      .then((data) => {
        setScript(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [scriptId]);

  const updateField = (field: string, value: any) => {
    setScript((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateChapter = (index: number, field: string, value: any) => {
    setScript((prev: any) => {
      const chapters = [...(prev.chapters || [])];
      chapters[index] = { ...chapters[index], [field]: value };
      return { ...prev, chapters };
    });
  };

  const updateScene = (chapterIndex: number, field: string, value: any) => {
    setScript((prev: any) => {
      const chapters = [...(prev.chapters || [])];
      const scenes = [...(chapters[chapterIndex]?.scenes || [])];
      scenes[0] = { ...scenes[0], [field]: value };
      chapters[chapterIndex] = { ...chapters[chapterIndex], scenes };
      return { ...prev, chapters };
    });
  };

  const handleSave = async (publish = false) => {
    if (!script) return;
    if (publish) setPublishing(true);
    else setSaving(true);
    setError("");
    try {
      await ugcApi.updateScript(scriptId, {
        title: script.title,
        description: script.description,
        chapters: script.chapters,
        ...(publish ? { is_public: true } : {}),
      });
      if (publish) {
        router.push("/my-scripts");
      } else {
        setScript((prev: any) => ({ ...prev, updated_at: new Date().toISOString() }));
      }
    } catch (e: any) {
      setError(e.message);
    }
    if (publish) setPublishing(false);
    else setSaving(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">{t("result.noScript")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/my-scripts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("editScript.title")}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("editScript.basicInfo")}</CardTitle>
            <CardDescription>{t("editScript.basicDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("editScript.titleLabel")}</Label>
              <Input
                value={script.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("editScript.descriptionLabel")}</Label>
              <Textarea
                value={script.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{script.style}</Badge>
              <Badge variant="outline">{script.era}</Badge>
              <Badge variant={script.is_public ? "default" : "secondary"}>
                {script.is_public ? t("common.public") : t("common.draft")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {script.chapters?.map((ch: any, i: number) => {
          const scene = ch.scenes?.[0] || {};
          return (
            <Card key={ch.id || i}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge>{i + 1}</Badge>
                  <Input
                    value={ch.title || ""}
                    onChange={(e) => updateChapter(i, "title", e.target.value)}
                    className="border-0 px-0 text-base font-semibold focus-visible:ring-0"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">{t("editScript.locationLabel")}</Label>
                  <Input
                    value={ch.location || ""}
                    onChange={(e) => updateChapter(i, "location", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("editScript.narrationLabel")}</Label>
                  <Textarea
                    value={scene.narration || ""}
                    onChange={(e) => updateScene(i, "narration", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("editScript.dialogueLabel")}</Label>
                  <Textarea
                    value={scene.dialogue?.text || ""}
                    onChange={(e) =>
                      updateScene(i, "dialogue", { ...scene.dialogue, text: e.target.value })
                    }
                    className="min-h-[60px]"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}

        <div className="flex gap-3 justify-end">
          <Link href="/my-scripts">
            <Button variant="outline">{t("common.cancel")}</Button>
          </Link>
          <Button className="gap-2" onClick={() => handleSave(false)} disabled={saving || publishing}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("common.save")}
          </Button>
          <Button className="gap-2" onClick={() => handleSave(true)} disabled={saving || publishing}>
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {t("result.publish")}
          </Button>
        </div>
      </div>
    </div>
  );
}
