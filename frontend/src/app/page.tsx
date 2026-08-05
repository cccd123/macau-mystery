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

/* ── Macau heritage skyline (SVG silhouettes) ── */
function MacauSkyline() {
  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[45%] pointer-events-none overflow-hidden">
      <svg viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        <defs>
          <linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--jade)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--jade)" stopOpacity="0.045" />
            <stop offset="100%" stopColor="var(--azulejo)" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="ms-hills" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--azulejo)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--azulejo)" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* Distant hills */}
        <path fill="url(#ms-hills)" d="M 0 360 Q 150 300 300 330 T 600 310 T 900 325 T 1200 305 T 1440 320 L 1440 400 L 0 400 Z" />

        {/* A-Ma Temple (left) */}
        <g transform="translate(60, 210)" fill="url(#ms-sky)">
          <path d="M 30 14 L 34 0 L 38 14 Z" />
          <path d="M 0 42 Q -10 36 -4 30 L 22 20 Q 34 14 46 20 L 72 30 Q 78 36 68 42 Z" />
          <rect x="8" y="42" width="56" height="38" />
          <rect x="2" y="80" width="68" height="5" />
          <rect x="-3" y="85" width="78" height="5" />
          <path d="M 26 56 L 26 80 L 42 80 L 42 56 Q 34 49 26 56 Z" fill="white" fillOpacity="0.3" />
        </g>

        {/* Trees */}
        <g transform="translate(260, 250)" fill="url(#ms-sky)">
          <rect x="6" y="22" width="3" height="18" />
          <circle cx="7.5" cy="16" r="11" />
        </g>
        <g transform="translate(300, 265)" fill="url(#ms-sky)">
          <rect x="5" y="18" width="3" height="15" />
          <circle cx="6.5" cy="13" r="9" />
        </g>

        {/* Colonial building (Dom Pedro V Theatre style) */}
        <g transform="translate(360, 245)" fill="url(#ms-sky)">
          <path d="M -5 5 L 45 -10 L 95 5 Z" />
          <rect x="-2" y="5" width="94" height="8" />
          <rect x="0" y="13" width="90" height="47" />
          <rect x="-6" y="60" width="102" height="5" />
          <rect x="4" y="13" width="3" height="47" fill="white" fillOpacity="0.25" />
          <rect x="20" y="13" width="3" height="47" fill="white" fillOpacity="0.25" />
          <rect x="42" y="13" width="3" height="47" fill="white" fillOpacity="0.25" />
          <rect x="66" y="13" width="3" height="47" fill="white" fillOpacity="0.25" />
          <rect x="82" y="13" width="3" height="47" fill="white" fillOpacity="0.25" />
          <path d="M 38 40 L 38 60 L 52 60 L 52 40 Q 45 33 38 40 Z" fill="white" fillOpacity="0.35" />
        </g>

        {/* Ruins of St. Paul's (center) */}
        <g transform="translate(590, 95)" fill="url(#ms-sky)">
          <rect x="49" y="0" width="4" height="15" />
          <rect x="43" y="4" width="16" height="4" />
          <path d="M 22 30 L 51 12 L 80 30 Z" />
          <circle cx="51" cy="24" r="4" fill="white" fillOpacity="0.25" />
          <rect x="20" y="30" width="62" height="20" />
          <path d="M 28 37 Q 32 33 36 37 L 36 46 L 28 46 Z" fill="white" fillOpacity="0.3" />
          <path d="M 47 37 Q 51 33 55 37 L 55 46 L 47 46 Z" fill="white" fillOpacity="0.3" />
          <path d="M 66 37 Q 70 33 74 37 L 74 46 L 66 46 Z" fill="white" fillOpacity="0.3" />
          <rect x="12" y="50" width="78" height="24" />
          <path d="M 43 57 L 43 70 L 59 70 L 59 57 Q 51 50 43 57 Z" fill="white" fillOpacity="0.3" />
          <path d="M 18 57 Q 22 53 26 57 L 26 70 L 18 70 Z" fill="white" fillOpacity="0.3" />
          <path d="M 76 57 Q 80 53 84 57 L 84 70 L 76 70 Z" fill="white" fillOpacity="0.3" />
          <rect x="6" y="74" width="90" height="30" />
          <path d="M 36 80 L 36 100 L 66 100 L 66 80 Q 51 66 36 80 Z" fill="white" fillOpacity="0.3" />
          <rect x="10" y="82" width="20" height="22" fill="white" fillOpacity="0.25" />
          <rect x="72" y="82" width="20" height="22" fill="white" fillOpacity="0.25" />
          <rect x="0" y="104" width="102" height="36" />
          <path d="M 39 110 L 39 134 L 63 134 L 63 110 Q 51 97 39 110 Z" fill="white" fillOpacity="0.3" />
          <rect x="-8" y="140" width="118" height="12" />
          <rect x="-14" y="152" width="130" height="8" />
        </g>

        {/* Small building */}
        <g transform="translate(820, 270)" fill="url(#ms-sky)">
          <rect x="0" y="0" width="60" height="35" />
          <path d="M -4 0 L 30 -10 L 64 0 Z" />
          <rect x="10" y="10" width="10" height="15" fill="white" fillOpacity="0.25" />
          <rect x="25" y="10" width="10" height="15" fill="white" fillOpacity="0.25" />
          <rect x="40" y="10" width="10" height="15" fill="white" fillOpacity="0.25" />
        </g>

        {/* Trees */}
        <g transform="translate(900, 260)" fill="url(#ms-sky)">
          <rect x="6" y="22" width="3" height="18" />
          <circle cx="7.5" cy="16" r="11" />
        </g>
        <g transform="translate(950, 275)" fill="url(#ms-sky)">
          <rect x="5" y="18" width="3" height="15" />
          <circle cx="6.5" cy="13" r="9" />
        </g>

        {/* Guia Lighthouse (right) */}
        <g transform="translate(1120, 175)" fill="url(#ms-sky)">
          <rect x="24" y="0" width="3" height="10" />
          <rect x="20" y="3" width="11" height="3" />
          <rect x="18" y="10" width="15" height="12" />
          <path d="M 15 22 Q 25.5 12 36 22 Z" />
          <rect x="15" y="22" width="21" height="68" />
          <rect x="21" y="32" width="9" height="7" fill="white" fillOpacity="0.3" />
          <rect x="21" y="48" width="9" height="7" fill="white" fillOpacity="0.3" />
          <rect x="21" y="64" width="9" height="7" fill="white" fillOpacity="0.3" />
          <rect x="21" y="80" width="9" height="7" fill="white" fillOpacity="0.3" />
          <rect x="8" y="90" width="35" height="12" />
          <rect x="2" y="102" width="47" height="8" />
          <rect x="-4" y="110" width="59" height="6" />
        </g>

        {/* Small shrine (far right) */}
        <g transform="translate(1240, 270)" fill="url(#ms-sky)">
          <path d="M 0 20 Q -6 16 -2 12 L 25 6 Q 33 2 41 6 L 68 12 Q 72 16 66 20 Z" />
          <rect x="4" y="20" width="58" height="25" />
          <rect x="0" y="45" width="66" height="4" />
          <path d="M 24 28 L 24 45 L 42 45 L 42 28 Q 33 22 24 28 Z" fill="white" fillOpacity="0.3" />
        </g>
      </svg>
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
    <div ref={ref} onMouseMove={handleMouse} className="relative w-full">
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
        {/* Macau landmark skyline */}
        <MacauSkyline />
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
