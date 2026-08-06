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

/* ── Macau heritage skyline (prominent SVG landmarks) ── */
function MacauSkyline() {
  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none overflow-hidden">
      <svg viewBox="0 0 1440 500" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        <defs>
          <linearGradient id="ms-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--jade)" stopOpacity="0" />
            <stop offset="30%" stopColor="var(--jade)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--azulejo)" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="ms-harbor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--azulejo)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="var(--azulejo)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* ── A-Ma Temple 妈阁庙 (left) ── sweeping roof, traditional Chinese */}
        <g transform="translate(50, 160)" fill="var(--jade)" opacity="0.14">
          {/* Ridge ornament */}
          <path d="M 46 18 L 50 0 L 54 18 Z" />
          {/* Sweeping roof with upturned eaves */}
          <path d="M -15 70 Q -25 58 -12 48 L 16 34 Q 30 24 50 20 Q 70 24 84 34 L 112 48 Q 125 58 115 70 Z" />
          {/* Eave tips curling upward */}
          <path d="M -12 48 Q -22 40 -18 32 L -10 40 Z" />
          <path d="M 112 48 Q 122 40 118 32 L 110 40 Z" />
          {/* Second tier roof */}
          <path d="M 0 82 Q -8 76 2 72 L 20 66 Q 38 58 50 56 Q 62 58 80 66 L 98 72 Q 108 76 100 82 Z" />
          {/* Body / walls */}
          <rect x="8" y="82" width="84" height="52" />
          {/* Central arched doorway */}
          <path d="M 36 100 L 36 134 L 64 134 L 64 100 Q 50 86 36 100 Z" fill="var(--background)" fillOpacity="0.7" />
          {/* Side windows */}
          <rect x="14" y="98" width="14" height="18" fill="var(--background)" fillOpacity="0.6" />
          <rect x="72" y="98" width="14" height="18" fill="var(--background)" fillOpacity="0.6" />
          {/* Stone gate entrance */}
          <rect x="24" y="118" width="52" height="16" fill="var(--background)" fillOpacity="0.5" />
          {/* Steps */}
          <rect x="2" y="134" width="96" height="6" />
          <rect x="-4" y="140" width="108" height="6" />
          <rect x="-10" y="146" width="120" height="5" />
        </g>

        {/* Trees (left area) */}
        <g transform="translate(220, 240)" fill="var(--jade)" opacity="0.1">
          <rect x="8" y="30" width="5" height="28" />
          <ellipse cx="10" cy="18" rx="16" ry="20" />
        </g>
        <g transform="translate(270, 260)" fill="var(--jade)" opacity="0.08">
          <rect x="6" y="24" width="4" height="22" />
          <ellipse cx="8" cy="14" rx="12" ry="16" />
        </g>

        {/* ── Dom Pedro V Theatre 岗顶剧院 (center-left) ── neoclassical columns */}
        <g transform="translate(340, 195)" fill="var(--azulejo)" opacity="0.13">
          {/* Triangular pediment */}
          <path d="M -8 8 L 60 -12 L 128 8 Z" />
          {/* Pediment detail */}
          <circle cx="60" cy="-1" r="5" fill="var(--background)" fillOpacity="0.5" />
          {/* Entablature */}
          <rect x="-4" y="8" width="128" height="10" />
          {/* Body with columns */}
          <rect x="0" y="18" width="120" height="72" />
          {/* Column gaps (negative space) */}
          <rect x="6" y="18" width="5" height="72" fill="var(--background)" fillOpacity="0.55" />
          <rect x="26" y="18" width="5" height="72" fill="var(--background)" fillOpacity="0.55" />
          <rect x="49" y="18" width="5" height="72" fill="var(--background)" fillOpacity="0.55" />
          <rect x="69" y="18" width="5" height="72" fill="var(--background)" fillOpacity="0.55" />
          <rect x="89" y="18" width="5" height="72" fill="var(--background)" fillOpacity="0.55" />
          <rect x="109" y="18" width="5" height="72" fill="var(--background)" fillOpacity="0.55" />
          {/* Central arched doorway */}
          <path d="M 46 52 L 46 90 L 74 90 L 74 52 Q 60 38 46 52 Z" fill="var(--background)" fillOpacity="0.65" />
          {/* Steps */}
          <rect x="-8" y="90" width="136" height="6" />
          <rect x="-14" y="96" width="148" height="5" />
        </g>

        {/* ── Ruins of St. Paul's 大三巴牌坊 (center piece) ── iconic baroque facade */}
        <g transform="translate(580, 50)" fill="var(--jade)" opacity="0.16">
          {/* Cross at summit */}
          <rect x="66" y="0" width="6" height="22" />
          <rect x="58" y="6" width="22" height="6" />
          {/* Triangular pediment */}
          <path d="M 28 44 L 69 18 L 110 44 Z" />
          {/* Pediment relief circle */}
          <circle cx="69" cy="36" r="6" fill="var(--background)" fillOpacity="0.5" />
          {/* Tier 4 - upper niche band */}
          <rect x="26" y="44" width="86" height="28" />
          {/* 3 arched niches */}
          <path d="M 36 54 Q 41 48 46 54 L 46 68 L 36 68 Z" fill="var(--background)" fillOpacity="0.6" />
          <path d="M 62 54 Q 69 46 76 54 L 76 68 L 62 68 Z" fill="var(--background)" fillOpacity="0.6" />
          <path d="M 92 54 Q 97 48 102 54 L 102 68 L 92 68 Z" fill="var(--background)" fillOpacity="0.6" />
          {/* Tier 3 - main window tier */}
          <rect x="16" y="72" width="106" height="34" />
          {/* Central large arched window */}
          <path d="M 56 82 L 56 100 L 82 100 L 82 82 Q 69 72 56 82 Z" fill="var(--background)" fillOpacity="0.6" />
          {/* Side arched windows */}
          <path d="M 22 82 Q 28 76 34 82 L 34 100 L 22 100 Z" fill="var(--background)" fillOpacity="0.55" />
          <path d="M 104 82 Q 110 76 116 82 L 116 100 L 104 100 Z" fill="var(--background)" fillOpacity="0.55" />
          {/* Decorative columns */}
          <rect x="18" y="76" width="4" height="30" fill="var(--background)" fillOpacity="0.4" />
          <rect x="46" y="76" width="3" height="30" fill="var(--background)" fillOpacity="0.35" />
          <rect x="89" y="76" width="3" height="30" fill="var(--background)" fillOpacity="0.35" />
          <rect x="116" y="76" width="4" height="30" fill="var(--background)" fillOpacity="0.4" />
          {/* Tier 2 - grand arch tier */}
          <rect x="8" y="106" width="122" height="44" />
          {/* Large central arch */}
          <path d="M 48 114 L 48 144 L 90 144 L 90 114 Q 69 96 48 114 Z" fill="var(--background)" fillOpacity="0.6" />
          {/* Side rectangular niches */}
          <rect x="14" y="116" width="26" height="32" fill="var(--background)" fillOpacity="0.5" />
          <rect x="98" y="116" width="26" height="32" fill="var(--background)" fillOpacity="0.5" />
          {/* Flanking columns */}
          <rect x="42" y="110" width="4" height="40" fill="var(--background)" fillOpacity="0.4" />
          <rect x="92" y="110" width="4" height="40" fill="var(--background)" fillOpacity="0.4" />
          {/* Tier 1 - ground level with main doorway */}
          <rect x="0" y="150" width="138" height="52" />
          {/* Main doorway arch */}
          <path d="M 50 160 L 50 196 L 88 196 L 88 160 Q 69 142 50 160 Z" fill="var(--background)" fillOpacity="0.6" />
          {/* Side doorways */}
          <path d="M 8 166 L 8 196 L 32 196 L 32 166 Q 20 154 8 166 Z" fill="var(--background)" fillOpacity="0.5" />
          <path d="M 106 166 L 106 196 L 130 196 L 130 166 Q 118 154 106 166 Z" fill="var(--background)" fillOpacity="0.5" />
          {/* Foundation steps */}
          <rect x="-10" y="202" width="158" height="14" />
          <rect x="-18" y="216" width="174" height="12" />
          <rect x="-24" y="228" width="186" height="8" />
        </g>

        {/* Trees (center-right) */}
        <g transform="translate(860, 240)" fill="var(--jade)" opacity="0.1">
          <rect x="8" y="30" width="5" height="28" />
          <ellipse cx="10" cy="18" rx="16" ry="20" />
        </g>

        {/* Small colonial building */}
        <g transform="translate(920, 245)" fill="var(--azulejo)" opacity="0.1">
          <path d="M -4 6 L 40 -6 L 84 6 Z" />
          <rect x="0" y="6" width="80" height="48" />
          <rect x="8" y="16" width="12" height="20" fill="var(--background)" fillOpacity="0.5" />
          <rect x="34" y="16" width="12" height="20" fill="var(--background)" fillOpacity="0.5" />
          <rect x="60" y="16" width="12" height="20" fill="var(--background)" fillOpacity="0.5" />
        </g>

        {/* Trees (right area) */}
        <g transform="translate(1040, 260)" fill="var(--jade)" opacity="0.08">
          <rect x="6" y="24" width="4" height="22" />
          <ellipse cx="8" cy="14" rx="12" ry="16" />
        </g>

        {/* ── Guia Lighthouse 东望洋灯塔 (right) ── tall cylindrical tower */}
        <g transform="translate(1120, 110)" fill="var(--azulejo)" opacity="0.14">
          {/* Lightning rod */}
          <rect x="28" y="0" width="4" height="16" />
          <rect x="24" y="4" width="12" height="4" />
          {/* Lantern room (glass panels) */}
          <rect x="20" y="16" width="20" height="18" />
          <rect x="24" y="20" width="4" height="10" fill="var(--background)" fillOpacity="0.6" />
          <rect x="32" y="20" width="4" height="10" fill="var(--background)" fillOpacity="0.6" />
          {/* Dome */}
          <path d="M 16 34 Q 30 18 44 34 Z" />
          {/* Tower body */}
          <rect x="16" y="34" width="28" height="100" />
          {/* Windows */}
          <rect x="22" y="46" width="16" height="10" fill="var(--background)" fillOpacity="0.6" />
          <rect x="22" y="68" width="16" height="10" fill="var(--background)" fillOpacity="0.6" />
          <rect x="22" y="90" width="16" height="10" fill="var(--background)" fillOpacity="0.6" />
          <rect x="22" y="112" width="16" height="10" fill="var(--background)" fillOpacity="0.6" />
          {/* Base platform */}
          <rect x="6" y="134" width="48" height="16" />
          <rect x="0" y="150" width="60" height="10" />
          <rect x="-6" y="160" width="72" height="8" />
        </g>

        {/* Small Portuguese chapel (far right) */}
        <g transform="translate(1260, 240)" fill="var(--jade)" opacity="0.1">
          <path d="M 28 8 L 35 -4 L 42 8 Z" />
          <rect x="26" y="-2" width="4" height="10" />
          <rect x="22" y="8" width="26" height="46" />
          <path d="M 30 22 L 30 54 L 42 54 L 42 22 Q 36 14 30 22 Z" fill="var(--background)" fillOpacity="0.5" />
          <rect x="18" y="54" width="34" height="4" />
        </g>

        {/* ── Harbor wave pattern at bottom ── */}
        <path fill="url(#ms-harbor)" d="M 0 440 Q 120 420 240 435 T 480 428 T 720 438 T 960 425 T 1200 435 T 1440 430 L 1440 500 L 0 500 Z" />
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
  const { t, locale } = useTranslation();
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
                      {routeNames[name]?.[locale] || name}
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
