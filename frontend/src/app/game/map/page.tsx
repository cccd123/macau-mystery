"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, BookOpen, ChevronDown, Info, MessageCircle, Send, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { gameApi, locationApi, StoryInfo, LocationInfo } from "@/lib/api";

const MapViewer = dynamic(() => import("@/components/map-viewer"), {
  ssr: false,
});

/* ── Fallback locations when API is unavailable ── */
const FALLBACK_STORY: StoryInfo = {
  slug: "macau_mystery_demo",
  title: "\u6fb3\u95e8\u79d8\u5f55\uff1a\u4e2d\u8461\u60ac\u6848",
  description: "",
  chapters: [
    { id: "1", title: "\u7b2c\u4e00\u7ae0\uff1a\u5988\u9601\u5e99", location: "\u5988\u9601\u5e99", gps: { lat: 22.1867, lng: 113.5318 } },
    { id: "2", title: "\u7b2c\u4e8c\u7ae0\uff1a\u4e9a\u5a46\u4e95\u524d\u5730", location: "\u4e9a\u5a46\u4e95\u524d\u5730", gps: { lat: 22.1876, lng: 113.5331 } },
    { id: "3", title: "\u7b2c\u4e09\u7ae0\uff1a\u90d1\u5bb6\u5927\u5c4b", location: "\u90d1\u5bb6\u5927\u5c4b", gps: { lat: 22.1879, lng: 113.5347 } },
    { id: "4", title: "\u7b2c\u56db\u7ae0\uff1a\u5c97\u9876\u5267\u9662", location: "\u5c97\u9876\u5267\u9662", gps: { lat: 22.1892, lng: 113.5389 } },
    { id: "5", title: "\u7b2c\u4e94\u7ae0\uff1a\u8bae\u4e8b\u4ead\u524d\u5730", location: "\u8bae\u4e8b\u4ead\u524d\u5730", gps: { lat: 22.1918, lng: 113.5396 } },
    { id: "6", title: "\u7b2c\u516d\u7ae0\uff1a\u5927\u4e09\u5df4\u724c\u574a", location: "\u5927\u4e09\u5df4\u724c\u574a", gps: { lat: 22.1946, lng: 113.5414 } },
  ],
};

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  a_ma_temple: ["妈阁庙始建于什么时候？", "Macau 这个名字和妈阁庙有关吗？"],
  lilau_square: ["亚婆井的葡文意思是什么？", "为什么亚婆井对葡萄牙人很重要？"],
  mandarins_house: ["郑家大屋是谁的故居？", "《盛世危言》是在哪里写成的？"],
  dom_pedro_v_theatre: ["岗顶剧院建于哪一年？", "它为什么被称为中国第一所西式剧院？"],
  senado_square: ["议事亭前地为什么又叫喷水池？", "广场地面的碎石有什么特色？"],
  ruins_of_st_pauls: ["大三巴牌坊的前身是什么？", "圣保禄学院有什么历史地位？"],
};

export default function MapPage() {
  const { t } = useTranslation();
  const [stories, setStories] = useState<StoryInfo[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightedId) {
      const el = document.getElementById(`loc-card-${highlightedId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightedId]);

  useEffect(() => {
    Promise.all([
      gameApi.getStories(),
      locationApi.list().catch(() => ({ items: [] })),
    ])
      .then(([storyData, locationData]) => {
        const all = storyData.length > 0 ? storyData : [FALLBACK_STORY];
        setStories(all);
        const four = all.find((s) => s.chapters.length === 4);
        setSelectedSlug(four?.slug || all[0].slug);
        setLocations(locationData.items || []);
      })
      .catch(() => {
        setStories([FALLBACK_STORY]);
        setSelectedSlug(FALLBACK_STORY.slug);
        setLocations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const locationByName = (name: string): LocationInfo | undefined => {
    return locations.find(
      (loc) => loc.name === name || loc.name.includes(name) || name.includes(loc.name)
    );
  };

  const currentStory = useMemo(
    () => stories.find((s) => s.slug === selectedSlug) ?? stories[0],
    [stories, selectedSlug]
  );

  const mapLocations = useMemo(() => {
    if (!currentStory) return [];
    return currentStory.chapters
      .filter((ch) => ch.gps)
      .map((ch, i) => ({
        id: String(i + 1),
        name: ch.location,
        lat: ch.gps!.lat,
        lng: ch.gps!.lng,
        status: (i === 0 ? "current" : "locked") as "current" | "locked",
        description: ch.title,
      }));
  }, [currentStory]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6 text-jade" />
            {t("map.title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("map.routeDesc")}
          </p>
        </div>

        {/* Story Selector */}
        {stories.length > 1 && (
          <div className="relative">
            <Button
              variant="outline"
              className="gap-2 min-w-[200px] justify-between"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="truncate">{currentStory?.title}</span>
              </span>
              <Badge variant="outline" className="ml-2 text-xs shrink-0">
                {currentStory?.chapters.length} {t("admin.locations")}
              </Badge>
              <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </Button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-md py-1 z-50 min-w-[260px]">
                {stories.map((s) => (
                  <button
                    key={s.slug}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors ${
                      s.slug === selectedSlug ? "font-bold text-primary bg-accent/50" : ""
                    }`}
                    onClick={() => {
                      setSelectedSlug(s.slug);
                      setDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {s.chapters.length} {t("admin.locations")}
                      </Badge>
                    </div>
                    {s.description && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{s.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Story info banner */}
      {currentStory && (
        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold">{currentStory.title}</span>
            <span className="text-muted-foreground text-sm ml-2">
              {currentStory.chapters.length} {t("admin.locations")}
            </span>
          </div>
        </div>
      )}

      {/* Mobile tab switcher */}
      <div className="md:hidden mb-4">
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              mobileTab === "map" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setMobileTab("map")}
          >
            {t("map.mapTab")}
          </button>
          <button
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              mobileTab === "list" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => setMobileTab("list")}
          >
            {t("map.listTab")}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Map */}
        <div className={`h-[320px] md:h-[600px] rounded-lg overflow-hidden border shadow-sm ${mobileTab !== "map" ? "hidden md:block" : ""}`}>
          {mapLocations.length > 0 ? (
            <MapViewer
              locations={mapLocations}
              onLocationClick={(id) => {
                setHighlightedId(id);
                setMobileTab("list");
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>{t("map.locked")} - GPS coordinates not available</p>
            </div>
          )}
        </div>

        {/* Location list */}
        <div className={`space-y-3 md:max-h-[600px] md:overflow-y-auto md:pr-1 ${mobileTab !== "list" ? "hidden md:block" : ""}`}>
          {currentStory?.chapters.map((ch, i) => {
            const loc = locationByName(ch.location);
            return (
              <Card
                id={`loc-card-${ch.id}`}
                key={ch.id}
                className={`transition-all ${i > 0 ? "opacity-75" : ""} ${
                  highlightedId === ch.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={i === 0 ? "default" : "outline"}>{i + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight">{ch.location}</CardTitle>
                      {ch.title && ch.title !== ch.location && (
                        <CardDescription className="text-xs mt-0.5">{ch.title}</CardDescription>
                      )}
                    </div>
                    {i === 0 && (
                      <Badge variant="secondary" className="shrink-0">{t("map.currentLocation")}</Badge>
                    )}
                  </div>
                </CardHeader>
                {ch.gps && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground font-mono mb-2">
                      {ch.gps.lat.toFixed(4)}°N, {ch.gps.lng.toFixed(4)}°E
                    </p>
                    {loc && <LocationDialog loc={loc} />}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LocationDialog({ loc }: { loc: LocationInfo }) {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const suggestions = SUGGESTED_QUESTIONS[loc.id] || [];

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    setQuestion(q);
    setAsking(true);
    setAnswer("");
    try {
      const res = await locationApi.ask(loc.id, q);
      setAnswer(res.answer);
    } catch (e: any) {
      setAnswer(t("map.askError") + (e.message || ""));
    }
    setAsking(false);
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button className="text-left text-sm text-primary hover:underline flex items-start gap-1.5 mt-1">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <span className="font-medium">{t("map.locationIntro")}:</span>{" "}
              {loc.summary}
            </span>
          </button>
        }
      />
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{loc.name}</DialogTitle>
          <DialogDescription>{loc.summary}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="history" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">{t("map.historyTab")}</TabsTrigger>
            <TabsTrigger value="ask">{t("map.askTab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="space-y-3 mt-4 text-sm text-muted-foreground leading-relaxed">
            <p>{loc.description}</p>
            {loc.source_url && (
              <a
                href={loc.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs"
              >
                {t("map.readMore")}: {loc.source_title}
              </a>
            )}
          </TabsContent>
          <TabsContent value="ask" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">{t("map.askDesc")}</p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    className="text-xs px-2.5 py-1 rounded-full border bg-muted hover:bg-accent transition-colors"
                    onClick={() => handleAsk(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("map.askPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && handleAsk(question)}
              />
              <Button size="icon" onClick={() => handleAsk(question)} disabled={asking || !question.trim()}>
                {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {answer && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex items-center gap-1.5 text-primary font-medium mb-1">
                  <MessageCircle className="h-4 w-4" />
                  {t("map.aiAnswer")}
                </div>
                <p className="text-muted-foreground leading-relaxed">{answer}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
