"use client";

import { useState, useEffect } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  PenTool,
  HardDrive,
  BookOpen,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

interface Script {
  id: string;
  title: string;
  description?: string;
  status: string;
  chapters_count: number;
  players_count: number;
  created_at: string;
  chapters?: any[];
}

export default function AdminPage() {
  const { t } = useTranslation();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewScript, setPreviewScript] = useState<Script | null>(null);

  async function fetchScripts() {
    setLoading(true);
    try {
      const data = await adminApi.listScripts();
      setScripts(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("common.retry"));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteScript(deleteId);
      setScripts((prev) => prev.filter((s) => s.id !== deleteId));
    } catch (e: any) {
      setError(t("common.delete") + ": " + e.message);
    }
    setDeleteId(null);
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      await adminApi.publishScript(id);
      setScripts((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: currentStatus === "published" ? "draft" : "published",
              }
            : s
        )
      );
    } catch (e: any) {
      setError(t("common.published") + ": " + e.message);
    }
  };

  const published = scripts.filter((s) => s.status === "published").length;
  const totalPlayers = scripts.reduce((sum, s) => sum + (s.players_count || 0), 0);

  const stats = [
    { label: t("admin.totalScripts"), value: scripts.length },
    { label: t("admin.totalPlayers"), value: totalPlayers },
    { label: t("admin.published"), value: published },
    { label: t("admin.drafts"), value: scripts.length - published },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/scripts/ai-create">
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t("admin.aiCreate")}
            </Button>
          </Link>
          <Link href="/admin/scripts/new">
            <Button className="gap-2">
              <PenTool className="h-4 w-4" />
              {t("admin.manualCreate")}
            </Button>
          </Link>
          <Link href="/admin/media">
            <Button variant="outline" className="gap-2">
              <HardDrive className="h-4 w-4" />
              {t("admin.mediaStorage")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Scripts List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.scriptList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">{error}</p>
              <Button variant="outline" onClick={fetchScripts}>
                {t("common.retry")}
              </Button>
            </div>
          ) : scripts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.noScripts")}
            </div>
          ) : (
            <div className="space-y-3">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{script.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {script.chapters_count || 0} {t("admin.locations")} ·{" "}
                        {script.players_count || 0} {t("admin.players")} ·{" "}
                        {script.created_at}
                      </p>
                    </div>
                    <Badge
                      variant={
                        script.status === "published" ? "default" : "secondary"
                      }
                    >
                      {script.status === "published"
                        ? t("common.published")
                        : t("common.draft")}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/scripts/${script.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePublish(script.id, script.status)}
                    >
                      {script.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewScript(script)}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteId(script.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* UGC Submissions Review Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("admin.submissions")}</CardTitle>
          <CardDescription>{t("admin.submissionsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t("admin.noSubmissions")}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("admin.deleteDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewScript}
        onOpenChange={(open) => !open && setPreviewScript(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.previewTitle")}</DialogTitle>
            <DialogDescription>
              {previewScript?.title || ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {previewScript?.chapters && previewScript.chapters.length > 0 ? (
              previewScript.chapters.map((ch: any, i: number) => (
                <div key={ch.id || i} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">
                    {i + 1}. {ch.title || ch.location || t("common.noDescription")}
                  </h3>
                  {ch.scenes?.[0] && (
                    <>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                        {ch.scenes[0].narration}
                      </p>
                      {ch.scenes[0].dialogue && (
                        <div className="bg-muted rounded p-2 mb-2 text-sm">
                          <span className="font-medium">
                            {ch.scenes[0].dialogue.npc}:
                          </span>{" "}
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
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {t("admin.noScripts")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
