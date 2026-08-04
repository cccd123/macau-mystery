"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Eye, EyeOff, LogIn } from "lucide-react";
import { ugcApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

export default function MyScriptsPage() {
  const { t } = useTranslation();
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) {
      loadScripts();
    } else {
      setLoading(false);
    }
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ugcApi.listMyScripts();
      setScripts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const togglePublish = async (script: any) => {
    try {
      await ugcApi.publishScript(script.id, !script.is_public);
      loadScripts();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">{t("myScripts.title")}</h1>
          <p className="text-muted-foreground mb-6">{t("myScripts.subtitle")}</p>
          <p className="text-sm text-muted-foreground mb-4">Please login to view your scripts.</p>
          <Link href="/login">
            <Button>
              <LogIn className="h-4 w-4 mr-2" />
              {t("nav.login")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("myScripts.title")}</h1>
        <p className="text-muted-foreground">{t("myScripts.subtitle")}</p>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}

      {scripts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{t("myScripts.empty")}</p>
            <Link href="/create">
              <Button>{t("home.createBtn")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scripts.map((script) => (
            <Card key={script.id}>
              <CardHeader>
                <CardTitle className="text-lg">{script.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={script.is_public ? "default" : "secondary"}>
                    {script.is_public ? t("common.public") : t("common.private")}
                  </Badge>
                  <span className="text-muted-foreground">
                    {script.views_count || 0} {t("result.views")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {script.description || "No description"}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(script)}>
                    {script.is_public ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {script.is_public ? t("common.private") : t("common.public")}
                  </Button>
                  <Link href={`/game/${script.id}`}>
                    <Button size="sm">{t("result.play")}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
