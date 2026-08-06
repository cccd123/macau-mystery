"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, ArrowLeft, Loader2, CheckCircle2, HardDrive, Info } from "lucide-react";
import { mediaApi, UploadTarget, StoredObject } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export default function AdminMediaPage() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<"video" | "poster">("poster");
  const [filename, setFilename] = useState("demo-poster.jpg");
  const [size, setSize] = useState("1048576");
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<UploadTarget | null>(null);
  const [completed, setCompleted] = useState<StoredObject | null>(null);
  const [error, setError] = useState("");

  const handleRequestUpload = async () => {
    setLoading(true);
    setError("");
    setTarget(null);
    setCompleted(null);
    try {
      const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const res = await mediaApi.requestUpload({
        kind,
        filename,
        content_type: contentType,
        size_bytes: Number(size),
      });
      setTarget(res);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || t("create.error"));
    }
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!target) return;
    setLoading(true);
    setError("");
    try {
      const res = await mediaApi.completeUpload({
        object_key: target.object_key,
        kind,
        expected_size_bytes: Number(size),
      });
      setCompleted(res);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || t("create.error"));
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-jade" />
            {t("media.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("media.subtitle")}</p>
        </div>
      </div>

      <Alert className="mb-6 border-jade/30 bg-jade/5">
        <Info className="h-4 w-4 text-jade" />
        <AlertDescription>
          <span className="font-medium">{t("media.usage")}:</span> {t("media.usageDesc")}
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("media.requestUpload")}</CardTitle>
          <CardDescription>{t("media.usageDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("media.kind")}</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "video" | "poster")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">{t("media.video")}</SelectItem>
                  <SelectItem value="poster">{t("media.poster")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("media.size")}</Label>
              <Input
                type="number"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                min={1}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("media.filename")}</Label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. chapter1-poster.jpg"
            />
          </div>
          <Button
            className="w-full gap-2"
            onClick={handleRequestUpload}
            disabled={loading || !filename}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {t("media.requestUrl")}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {target && (
        <Card className="mb-6 border-jade/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-jade" />
              {t("media.urlReady")}
            </CardTitle>
            <CardDescription>
              {t("media.usageDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t("media.objectKey")}</Label>
              <code className="block text-xs bg-muted p-2 rounded break-all">{target.object_key}</code>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("media.publicUrl")}</Label>
              <code className="block text-xs bg-muted p-2 rounded break-all">{target.public_url}</code>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("media.presignedUrl")}</Label>
              <code className="block text-xs bg-muted p-2 rounded break-all">{target.upload_url}</code>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={handleComplete} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t("media.completeUpload")}
            </Button>
          </CardContent>
        </Card>
      )}

      {completed && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">{t("media.uploadRegistered")}</span>
            </div>
            <code className="block text-xs bg-white/50 dark:bg-black/20 p-2 rounded break-all">
              {completed.public_url}
            </code>
            <Badge variant="outline" className="mt-2">
              {completed.content_type} · {(completed.size_bytes / 1024 / 1024).toFixed(2)} MB
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
