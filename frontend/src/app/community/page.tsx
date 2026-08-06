"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";
import { ugcApi } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

export default function CommunityPage() {
  const { t } = useTranslation();
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const data = await ugcApi.listPublicScripts();
      setScripts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
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
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("community.title")}</h1>
        <p className="text-muted-foreground">{t("community.subtitle")}</p>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}

      {scripts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{t("community.empty")}</p>
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{script.author || "Anonymous"}</span>
                  <span>·</span>
                  <span>
                    {script.views_count || 0} {t("result.views")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {script.description || t("common.noDescription")}
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline">{script.style || "drama"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
