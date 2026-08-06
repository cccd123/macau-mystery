"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, PenTool, Loader2, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

export default function AICreatePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState("quick");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      await adminApi.aiGenerateScript(input, mode);
      router.push("/admin");
    } catch (e: any) {
      setError(t("aiCreate.error") + ": " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("aiCreate.backToAdmin")}
      </Link>

      <h1 className="text-2xl font-bold mb-2">{t("aiCreate.title")}</h1>
      <p className="text-muted-foreground mb-6">{t("aiCreate.subtitle")}</p>

      <Alert className="mb-6 border-jade/30 bg-jade/5">
        <Info className="h-4 w-4 text-jade" />
        <AlertDescription>
          <span className="font-medium">{t("aiCreate.relationTitle")}</span> ·{" "}
          {t("aiCreate.relationDesc")}
        </AlertDescription>
      </Alert>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <Tabs value={mode} onValueChange={setMode} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {t("aiCreate.quickTab")}
          </TabsTrigger>
          <TabsTrigger value="polish" className="gap-2">
            <PenTool className="h-4 w-4" />
            {t("aiCreate.polishTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("aiCreate.quickTitle")}
              </CardTitle>
              <CardDescription>{t("aiCreate.quickDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t("aiCreate.quickPlaceholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t("aiCreate.quickNote")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="polish" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("aiCreate.polishTitle")}
              </CardTitle>
              <CardDescription>{t("aiCreate.polishDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t("aiCreate.polishPlaceholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t("aiCreate.polishNote")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleGenerate}
        disabled={!input.trim() || loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("aiCreate.generating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {mode === "quick" ? t("aiCreate.quickBtn") : t("aiCreate.polishBtn")}
          </>
        )}
      </Button>
    </div>
  );
}
