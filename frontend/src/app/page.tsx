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
import { BookOpen, PenTool, Map, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { adminApi } from "@/lib/api";

export default function HomePage() {
  const { t } = useTranslation();
  const [route, setRoute] = useState<string[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(true);

  useEffect(() => {
    adminApi
      .getRoute()
      .then((data) => setRoute(Array.isArray(data) ? data : []))
      .catch(() =>
        setRoute([
          "Barra Temple",
          "Lilau Square",
          "Mandarin House",
          "Dom Pedro V Theatre",
          "Senado Square",
          "Ruins of St Paul",
        ])
      )
      .finally(() => setLoadingRoute(false));
  }, []);

  const routeNames: Record<string, Record<string, string>> = {
    "Barra Temple": { en: "A-Ma Temple", "zh-CN": "\u5988\u9601\u5e99", "zh-TW": "\u5abd\u95a3\u5edf" },
    "Lilau Square": { en: "Lilau Square", "zh-CN": "\u4e9a\u5a46\u4e95\u524d\u5730", "zh-TW": "\u4e9e\u5a46\u4e95\u524d\u5730" },
    "Mandarin House": { en: "Mandarin's House", "zh-CN": "\u90d1\u5bb6\u5927\u5c4b", "zh-TW": "\u912d\u5bb6\u5927\u5c4b" },
    "Dom Pedro V Theatre": { en: "Dom Pedro V Theatre", "zh-CN": "\u5c97\u9876\u5267\u9662", "zh-TW": "\u5d97\u9802\u5287\u9662" },
    "Senado Square": { en: "Senado Square", "zh-CN": "\u8bae\u4e8b\u4ead\u524d\u5730", "zh-TW": "\u8b70\u4e8b\u4ead\u524d\u5730" },
    "Ruins of St Paul": { en: "Ruins of St. Paul's", "zh-CN": "\u5927\u4e09\u5df4\u724c\u574a", "zh-TW": "\u5927\u4e09\u5df4\u724c\u574a" },
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            {t("home.tagline")}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            {t("home.title")}
            <span className="text-muted-foreground text-2xl md:text-3xl block mt-2">
              Macau Mystery
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("home.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/game/macau_mystery_02">
              <Button size="lg" className="gap-2 text-lg px-8">
                <BookOpen className="h-5 w-5" />
                {t("home.startBtn")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/create">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                <PenTool className="h-5 w-5" />
                {t("home.createBtn")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {t("home.featuresTitle")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t("home.feature1Title")}</CardTitle>
                <CardDescription>{t("home.feature1Desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>{t("home.feature1a")}</li>
                  <li>{t("home.feature1b")}</li>
                  <li>{t("home.feature1c")}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <PenTool className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t("home.feature2Title")}</CardTitle>
                <CardDescription>{t("home.feature2Desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>{t("home.feature2a")}</li>
                  <li>{t("home.feature2b")}</li>
                  <li>{t("home.feature2c")}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Map className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{t("home.feature3Title")}</CardTitle>
                <CardDescription>{t("home.feature3Desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>{t("home.feature3a")}</li>
                  <li>{t("home.feature3b")}</li>
                  <li>{t("home.feature3c")}</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Route Preview - Dynamic from backend */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            {t("home.routeTitle")}
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {t("home.routeDesc")}
          </p>
          {loadingRoute ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {route.map((name, i) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium">
                      {routeNames[name]?.[t("home.title") === "Macau Mystery" ? "en" : t("home.title") === "\u6fb3\u79d8" ? "zh-CN" : "zh-TW"] || name}
                    </span>
                  </div>
                  {i < route.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Guest Preview Info */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            {t("home.guestInfo")}
          </p>
          <Link href="/login">
            <Button variant="outline" className="gap-2">
              {t("home.loginPrompt")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <span>{t("home.unlock1")}</span>
            <span>{t("home.unlock2")}</span>
            <span>{t("home.unlock3")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
