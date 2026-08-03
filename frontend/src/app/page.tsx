"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Compass,
  Footprints,
  Loader2,
  Map,
  MapPin,
  PenTool,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { adminApi } from "@/lib/api";

const fallbackRoute = [
  "Barra Temple",
  "Lilau Square",
  "Mandarin House",
  "Dom Pedro V Theatre",
  "Senado Square",
  "Ruins of St Paul",
];

const routeNames: Record<string, Record<Locale, string>> = {
  "Barra Temple": {
    en: "A-Ma Temple",
    "zh-CN": "妈阁庙",
    "zh-TW": "媽閣廟",
  },
  "Lilau Square": {
    en: "Lilau Square",
    "zh-CN": "亚婆井前地",
    "zh-TW": "亞婆井前地",
  },
  "Mandarin House": {
    en: "Mandarin's House",
    "zh-CN": "郑家大屋",
    "zh-TW": "鄭家大屋",
  },
  "Dom Pedro V Theatre": {
    en: "Dom Pedro V Theatre",
    "zh-CN": "岗顶剧院",
    "zh-TW": "崗頂劇院",
  },
  "Senado Square": {
    en: "Senado Square",
    "zh-CN": "议事亭前地",
    "zh-TW": "議事亭前地",
  },
  "Ruins of St Paul": {
    en: "Ruins of St. Paul's",
    "zh-CN": "大三巴牌坊",
    "zh-TW": "大三巴牌坊",
  },
};

export default function HomePage() {
  const { locale, t } = useTranslation();
  const [route, setRoute] = useState<string[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) {
        setRoute(fallbackRoute);
        setLoadingRoute(false);
      }
    }, 1800);

    adminApi
      .getRoute()
      .then((data) => {
        if (!cancelled) {
          setRoute(Array.isArray(data) && data.length > 0 ? data : fallbackRoute);
          setLoadingRoute(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoute(fallbackRoute);
          setLoadingRoute(false);
        }
      })
      .finally(() => window.clearTimeout(fallbackTimer));

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="flex flex-col overflow-hidden">
      <section className="relative isolate min-h-[690px] overflow-hidden bg-[#061b20] text-white md:min-h-[calc(100svh-3.5rem)]">
        <Image
          src="/images/macau-mystery-hero.png"
          alt={t("home.heroImageAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[67%_center] md:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061b20]/95 via-[#061b20]/75 to-[#061b20]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061b20]/75 via-transparent to-[#061b20]/20" />
        <div
          aria-hidden="true"
          className="absolute inset-4 rounded-[1.75rem] border border-white/15 md:inset-7 md:rounded-[2.25rem]"
        />

        <div className="container relative mx-auto flex min-h-[690px] items-center px-6 py-20 md:min-h-[calc(100svh-3.5rem)] md:px-10 lg:px-16">
          <div className="max-w-2xl pt-8 md:pt-0">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-white/85 backdrop-blur-sm">
              <Sparkles className="size-4 text-brass" />
              {t("home.caseLabel")}
            </div>

            <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-brass uppercase">
              {t("home.tagline")}
            </p>
            <h1 className="max-w-xl text-6xl leading-[0.92] font-black tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              {locale === "en" ? (
                <>
                  <span className="block">Macau</span>
                  <span className="block text-brass">Mystery</span>
                </>
              ) : (
                <>
                  <span className="block">{t("home.title")}</span>
                  <span className="mt-4 block text-xl font-medium tracking-[0.16em] text-white/65 sm:text-2xl">
                    MACAU MYSTERY
                  </span>
                </>
              )}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/78 sm:text-lg">
              {t("home.subtitle")}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/game/demo">
                <Button
                  size="lg"
                  className="h-12 w-full gap-2 bg-brass px-7 text-base font-bold text-[#122a28] shadow-lg shadow-black/20 hover:bg-brass/90 sm:w-auto"
                >
                  <BookOpen className="size-5" />
                  {t("home.startBtn")}
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/create">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full gap-2 border-white/35 bg-white/5 px-7 text-base text-white backdrop-blur-sm hover:bg-white/15 hover:text-white sm:w-auto"
                >
                  <PenTool className="size-5" />
                  {t("home.createBtn")}
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/18 pt-5 text-xs font-medium tracking-[0.12em] text-white/65 uppercase">
              <span className="inline-flex items-center gap-2">
                <Footprints className="size-4 text-brass" />
                {t("home.heroMeta")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 md:py-28" aria-labelledby="experiences-title">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-azulejo uppercase">
              {t("home.featuresKicker")}
            </p>
            <h2 id="experiences-title" className="text-3xl font-black tracking-tight md:text-5xl">
              {t("home.featuresTitle")}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-12 md:grid-rows-2">
            <Card className="relative overflow-hidden border-0 bg-[#0b3436] text-white ring-0 md:col-span-7 md:row-span-2">
              <div aria-hidden="true" className="absolute -right-20 -bottom-24 size-64 rounded-full border-[38px] border-white/5" />
              <CardHeader className="relative p-7 md:p-10">
                <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-brass text-[#122a28]">
                  <Compass className="size-6" />
                </div>
                <CardTitle className="max-w-md text-3xl font-black md:text-4xl">
                  {t("home.feature1Title")}
                </CardTitle>
                <CardDescription className="max-w-xl text-base leading-7 text-white/68">
                  {t("home.feature1Desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative px-7 pb-8 md:px-10 md:pb-10">
                <ul className="grid gap-3 text-sm text-white/76 sm:grid-cols-2">
                  <li>{t("home.feature1a")}</li>
                  <li>{t("home.feature1b")}</li>
                  <li>{t("home.feature1c")}</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-azulejo/20 bg-card motion-safe:transition-transform motion-safe:hover:-translate-y-1 md:col-span-5">
              <CardHeader className="p-6 md:p-7">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent text-azulejo">
                  <PenTool className="size-5" />
                </div>
                <CardTitle className="text-xl font-bold">{t("home.feature2Title")}</CardTitle>
                <CardDescription className="leading-6">{t("home.feature2Desc")}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 md:px-7 md:pb-7">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>{t("home.feature2a")}</li>
                  <li>{t("home.feature2b")}</li>
                  <li>{t("home.feature2c")}</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-brass/25 bg-card motion-safe:transition-transform motion-safe:hover:-translate-y-1 md:col-span-5">
              <CardHeader className="p-6 md:p-7">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brass/15 text-brass">
                  <Map className="size-5" />
                </div>
                <CardTitle className="text-xl font-bold">{t("home.feature3Title")}</CardTitle>
                <CardDescription className="leading-6">{t("home.feature3Desc")}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 md:px-7 md:pb-7">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>{t("home.feature3a")}</li>
                  <li>{t("home.feature3b")}</li>
                  <li>{t("home.feature3c")}</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-[#09272b] py-20 text-white md:py-28" aria-labelledby="route-title">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-12 grid gap-5 md:grid-cols-[1fr_1fr] md:items-end">
            <div>
              <p className="mb-3 text-xs font-bold tracking-[0.18em] text-brass uppercase">
                {t("home.routeKicker")}
              </p>
              <h2 id="route-title" className="text-3xl font-black tracking-tight md:text-5xl">
                {t("home.routeTitle")}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/62 md:justify-self-end md:text-base">
              {t("home.routeDesc")}
            </p>
          </div>

          {loadingRoute ? (
            <div className="flex justify-center py-16" aria-label={t("common.loading")}>
              <Loader2 className="size-7 animate-spin text-brass" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {route.map((name, index) => (
                <div
                  key={name}
                  className="group flex min-h-28 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-5 motion-safe:transition-colors motion-safe:hover:bg-white/[0.08]"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-brass/50 bg-brass/10 font-mono text-sm font-bold text-brass">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <MapPin className="mb-2 size-4 text-azulejo" />
                    <p className="font-semibold text-white/90">
                      {routeNames[name]?.[locale] || name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-5 text-xs tracking-[0.08em] text-white/55 uppercase">
            <span className="inline-flex items-center gap-2">
              <Footprints className="size-4 text-brass" /> 2.5 km
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-brass" /> 90\u2013120 min
            </span>
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-16 md:px-8 md:py-24">
        <div className="container mx-auto rounded-[2rem] border border-brass/25 bg-limestone/35 px-6 py-12 text-center md:px-12 md:py-16">
          <p className="mb-3 text-xs font-bold tracking-[0.18em] text-lacquer uppercase">
            {t("home.guestKicker")}
          </p>
          <p className="mx-auto mb-6 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            {t("home.guestInfo")}
          </p>
          <Link href="/login">
            <Button className="h-11 gap-2 px-6">
              {t("home.loginPrompt")}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <div className="mt-7 flex flex-col justify-center gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
            <span>{t("home.unlock1")}</span>
            <span>{t("home.unlock2")}</span>
            <span>{t("home.unlock3")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
