"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, BookOpen, Sparkles } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

interface Chapter {
  id?: string;
  title?: string;
  location?: string;
  scenes?: {
    narration?: string;
    dialogue?: { npc?: string; text?: string };
    choices?: { id?: string; text?: string }[];
  }[];
}

interface Script {
  id: string;
  title: string;
  description?: string;
  status?: string;
  chapters?: Chapter[];
}

const FALLBACK_SCRIPT: Script = {
  id: "demo",
  title: "\u6fb3\u95e8\u79d8\u5f55\uff1a\u4e2d\u8461\u60ac\u6848",
  description:
    "\u73a9\u5bb6\u626e\u6f14\u6587\u7269\u4fee\u590d\u5e08\uff0c\u6cbf\u6fb3\u95e8\u5386\u53f2\u57ce\u533a\u7834\u89e3\u4e00\u4e2a\u8de8\u8d8a\u4e2d\u8461\u4e24\u4e2a\u5bb6\u65cf\u7684\u60ac\u6848\u3002",
  status: "draft",
  chapters: [
    {
      id: "ch1",
      title: "\u7b2c\u4e00\u7ae0\uff1a\u5988\u9601\u5e99",
      location: "\u5988\u9601\u5e99",
      scenes: [
        {
          narration:
            "\u4f60\u7ad9\u5728\u5988\u9601\u5e99\u7684\u77f3\u9636\u524d\uff0c\u6d77\u98ce\u5939\u6742\u7740\u6f06\u9999\u7684\u6c14\u606f\u3002\u4e00\u5c01\u6ca1\u6709\u5bc4\u4ef6\u4eba\u7684\u4fe1\u653e\u5728\u4f9b\u684c\u4e0a\uff0c\u91cc\u9762\u662f\u4e00\u5f20\u6bdb\u7b14\uff1a\u201c\u4ece\u6d77\u8fb9\u5f00\u59cb\uff0c\u627e\u5230\u4e2d\u8461\u4ea4\u878d\u7684\u7b2c\u4e00\u4e2a\u8ff9\u8c61\u3002\u201d",
          dialogue: { npc: "\u5e99\u795d", text: "\u8fd9\u4f4d\u5ba2\u5b98\uff0c\u4f60\u9762\u524d\u6709\u4e00\u6761\u9009\u62e9\u3002" },
          choices: [
            { id: "c1", text: "\u68c0\u67e5\u4fe1\u5c01\u80cc\u9762\u7684\u6c34\u5370" },
            { id: "c2", text: "\u8be2\u95ee\u5e99\u795d\u4eca\u65e5\u7684\u9999\u5ba2" },
          ],
        },
      ],
    },
    {
      id: "ch2",
      title: "\u7b2c\u4e8c\u7ae0\uff1a\u90d1\u5bb6\u5927\u5c4b",
      location: "\u90d1\u5bb6\u5927\u5c4b",
      scenes: [
        {
          narration:
            "\u90d1\u5bb6\u5927\u5c4b\u7684\u9752\u7816\u5730\u4e0b\u85cf\u7740\u4e00\u5c01\u6e05\u4ee3\u7684\u5bb6\u4e66\u3002\u4e66\u4e2d\u63d0\u5230\u7684\u300a\u76db\u4e16\u5fae\u8a00\u300b\u5370\u7ae0\u4e0e\u4fe1\u5c01\u4e0a\u7684\u5370\u7ae0\u7a33\u5408\u3002",
          dialogue: { npc: "\u5b88\u62a4\u4eba", text: "\u8fd9\u91cc\u7684\u4e00\u7816\u4e00\u74e6\u90fd\u6709\u6545\u4e8b\u3002" },
          choices: [
            { id: "c3", text: "\u7ffb\u9605\u5bb6\u4e66\u5bfb\u627e\u7ebf\u7d22" },
            { id: "c4", text: "\u89c2\u5bdf\u5927\u5c4b\u5eca\u5eca\u7684\u6d77\u6d6a\u82b1\u7816" },
          ],
        },
      ],
    },
  ],
};

export default function EditScriptPage() {
  const { t } = useTranslation();
  const params = useParams();
  const scriptId = params.id as string;

  const [script, setScript] = useState<Script>(FALLBACK_SCRIPT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    adminApi
      .listScripts()
      .then((list) => {
        if (!mounted) return;
        const found = list.find((s: any) => String(s.id) === scriptId);
        if (found) {
          setScript({
            ...FALLBACK_SCRIPT,
            ...found,
            chapters: found.chapters?.length
              ? found.chapters
              : FALLBACK_SCRIPT.chapters,
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [scriptId]);

  const updateField = (field: keyof Script, value: string) => {
    setScript((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await adminApi.updateScript(scriptId, {
        title: script.title,
        description: script.description,
      });
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin">
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

      <Tabs defaultValue="edit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {t("common.edit")}
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {t("admin.preview")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("editScript.basicInfo")}</CardTitle>
              <CardDescription>{t("editScript.basicDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("editScript.titleLabel")}</Label>
                <Input
                  value={script.title}
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
                <Badge variant="outline">{script.status || "draft"}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Link href="/admin">
              <Button variant="outline">{t("common.cancel")}</Button>
            </Link>
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("common.save")}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.previewTitle")}</CardTitle>
              <CardDescription>
                {script.title} · {(script.chapters || []).length}{" "}
                {t("admin.locations")}
              </CardDescription>
            </CardHeader>
          </Card>
          {(script.chapters || []).map((ch, i) => (
            <Card key={ch.id || i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {i + 1}. {ch.title || ch.location}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {ch.scenes?.[0] && (
                  <>
                    <p className="line-clamp-3 mb-2">
                      {ch.scenes[0].narration}
                    </p>
                    {ch.scenes[0].dialogue && (
                      <div className="bg-muted rounded p-2 mb-2">
                        <span className="font-medium">
                          {ch.scenes[0].dialogue.npc}:
                        </span>{" "}
                        {ch.scenes[0].dialogue.text}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {ch.scenes[0].choices?.map((choice) => (
                        <Badge key={choice.id} variant="outline">
                          {choice.text}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
