"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

/* ── Floating decorative elements (pure CSS shapes) ── */
function FloatingDecor() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large azulejo diamond - top right */}
      <div className="animate-float-slow absolute -top-8 right-[10%] w-24 h-24 rounded-lg border-2 border-azulejo/15 rotate-45 opacity-60" />
      {/* Small jade diamond - left */}
      <div className="animate-float absolute top-[20%] left-[8%] w-12 h-12 rounded-md border border-jade/20 rotate-45 opacity-50" />
      {/* Brass circle - bottom right */}
      <div className="animate-float-delayed absolute bottom-[15%] right-[15%] w-16 h-16 rounded-full border-2 border-brass/15 opacity-50" />
      {/* Lacquer small dot */}
      <div className="animate-pulse-glow absolute top-[35%] right-[30%] w-3 h-3 rounded-full bg-lacquer/20" />
      {/* Jade dot - left area */}
      <div className="animate-pulse-glow absolute bottom-[30%] left-[20%] w-4 h-4 rounded-full bg-jade/15" style={{ animationDelay: "1.5s" }} />
      {/* Azulejo line accent */}
      <div className="absolute top-[60%] left-[5%] w-32 h-px bg-gradient-to-r from-azulejo/20 to-transparent" />
      <div className="absolute top-[25%] right-[5%] w-24 h-px bg-gradient-to-l from-brass/20 to-transparent" />
    </div>
  );
}

/* ── Hero parallax wrapper ── */
function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({
      x: (e.clientX - cx) / rect.width,
      y: (e.clientY - cy) / rect.height,
    });
  }, []);

  return (
    <div ref={ref} onMouseMove={handleMouse} className="relative">
      {/* Parallax background layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${offset.x * -20}px, ${offset.y * -15}px)`,
        }}
      >
        <FloatingDecor />
      </div>
      {/* Content layer - subtle counter-parallax */}
      <div
        className="relative z-10 transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${offset.x * 5}px, ${offset.y * 3}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

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

  // Detect locale from title text
  const localeKey = t("home.title") === "Macau Mystery" ? "en" : t("home.title") === "\u6fb3\u79d8" ? "zh-CN" : "zh-TW";

  return (
    <div className="flex flex-col">
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Animated gradient background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-hero-gradient"
          style={{
            background:
              "linear-gradient(135deg, #f7f6f2 0%, #e3f0eb 25%, #e0edf6 50%, #f0e8d8 75%, #f7f6f2 100%)",
            backgroundSize: "200% 200%",
          }}
        />
        {/* Subtle azulejo pattern overlay */}
        <div aria-hidden="true" className="absolute inset-0 azulejo-pattern opacity-40" />
        {/* Bottom fade */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <HeroParallax>
          <div className="container mx-auto px-4 py-24 md:py-32 text-center">
            {/* Tagline badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-primary/20 text-primary px-5 py-2 rounded-full text-sm mb-8 shadow-sm">
              <Sparkles className="h-4 w-4 text-brass" />
              {t("home.tagline")}
            </div>

            {/* Title */}
            <h1 className="animate-fade-in-up delay-100 text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-tight">
              <span className="bg-gradient-to-r from-jade via-azulejo to-primary bg-clip-text text-transparent">
                {t("home.title")}
              </span>
              <span className="text-muted-foreground text-2xl md:text-3xl block mt-3 font-normal tracking-wide">
                Macau Mystery
              </span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {t("home.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/game/macau_mystery_demo">
                <Button
                  size="lg"
                  className="gap-2 text-lg px-8 btn-shimmer shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow duration-300"
                >
                  <BookOpen className="h-5 w-5" />
                  {t("home.startBtn")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/create">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-lg px-8 border-azulejo/30 hover:border-azulejo/60 hover:bg-azulejo/5 transition-all duration-300"
                >
                  <PenTool className="h-5 w-5" />
                  {t("home.createBtn")}
                </Button>
              </Link>
            </div>
          </div>
        </HeroParallax>
      </section>

      {/* ─── Features Section ─── */}
      <section className="py-20 relative">
        <div aria-hidden="true" className="absolute inset-0 azulejo-bg" />
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 tracking-tight">
            {t("home.featuresTitle")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: t("home.feature1Title"),
                desc: t("home.feature1Desc"),
                items: [t("home.feature1a"), t("home.feature1b"), t("home.feature1c")],
                iconBg: "bg-jade/10",
                iconColor: "text-jade",
                dotColor: "bg-jade/40",
                gradient: "from-jade/10 to-primary/5",
              },
              {
                icon: PenTool,
                title: t("home.feature2Title"),
                desc: t("home.feature2Desc"),
                items: [t("home.feature2a"), t("home.feature2b"), t("home.feature2c")],
                iconBg: "bg-azulejo/10",
                iconColor: "text-azulejo",
                dotColor: "bg-azulejo/40",
                gradient: "from-azulejo/10 to-accent/5",
              },
              {
                icon: Map,
                title: t("home.feature3Title"),
                desc: t("home.feature3Desc"),
                items: [t("home.feature3a"), t("home.feature3b"), t("home.feature3c")],
                iconBg: "bg-brass/10",
                iconColor: "text-brass",
                dotColor: "bg-brass/40",
                gradient: "from-brass/10 to-limestone/10",
              },
            ].map((feat, i) => (
              <Card
                key={i}
                className={`card-hover border-0 shadow-md bg-gradient-to-br ${feat.gradient} backdrop-blur-sm`}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${feat.iconBg} flex items-center justify-center mb-3`}>
                    <feat.icon className={`h-6 w-6 ${feat.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl">{feat.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {feat.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {feat.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${feat.dotColor} shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Route Timeline ─── */}
      <section className="py-20 bg-muted/30 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            {t("home.routeTitle")}
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            {t("home.routeDesc")}
          </p>
          {loadingRoute ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="relative max-w-4xl mx-auto">
              {/* Connecting line */}
              <div
                aria-hidden="true"
                className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-jade via-azulejo to-brass opacity-20 hidden md:block"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {route.map((name, i) => (
                  <div
                    key={name}
                    className="animate-scale-in card-hover relative flex flex-col items-center text-center"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {/* Step number */}
                    <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-jade text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md mb-3">
                      {i + 1}
                    </div>
                    {/* Location name */}
                    <span className="text-sm font-medium leading-tight">
                      {routeNames[name]?.[localeKey] || name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Guest CTA ─── */}
      <section className="py-16 relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 azulejo-bg" />
        <div className="container mx-auto px-4 text-center relative">
          <p className="text-muted-foreground text-sm mb-5">
            {t("home.guestInfo")}
          </p>
          <Link href="/login">
            <Button variant="outline" className="gap-2 border-brass/30 hover:border-brass/60 hover:bg-brass/5 transition-all duration-300">
              {t("home.loginPrompt")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-jade/50" />
              {t("home.unlock1")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-azulejo/50" />
              {t("home.unlock2")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brass/50" />
              {t("home.unlock3")}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
