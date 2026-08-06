"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StyleSelector } from "@/components/style-selector";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Info, MapPin, X } from "lucide-react";
import { locationApi, ugcApi, LocationInfo } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/context";

export default function CreatePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("suspense");
  const [era, setEra] = useState("qing");
  const [acts, setActs] = useState("3");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [error, setError] = useState("");

  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationQuery, setLocationQuery] = useState("");

  useEffect(() => {
    locationApi
      .list()
      .then((res) => setLocations(res.items || []))
      .catch(() => setLocations([]));
  }, []);

  const filteredLocations = useMemo(() => {
    const q = locationQuery.trim();
    if (!q) return locations;
    return locations.filter(
      (loc) =>
        loc.name.includes(q) ||
        loc.summary.includes(q) ||
        q.includes(loc.name)
    );
  }, [locations, locationQuery]);

  const toggleLocation = (name: string) => {
    setSelectedLocations((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await ugcApi.generate(input, style, {
        era,
        acts: parseInt(acts),
        custom_prompt: customPrompt || undefined,
        locations: selectedLocations.length > 0 ? selectedLocations : undefined,
      });
      sessionStorage.setItem("generatedScript", JSON.stringify(res));
      router.push("/create/result");
    } catch (e: any) {
      setError(t("create.error") + ": " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">{t("create.title")}</h1>
        <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-600">
          <Info className="h-3 w-3" />
          {t("create.demoMode")}
        </Badge>
      </div>
      <p className="text-muted-foreground mb-2">{t("create.subtitle")}</p>
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-6 text-sm text-amber-700 dark:text-amber-400">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{t("create.demoNotice")}</span>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("create.inputTitle")}</CardTitle>
          <CardDescription>{t("create.inputHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t("create.placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      <StyleSelector
        style={style}
        era={era}
        acts={acts}
        onStyleChange={setStyle}
        onEraChange={setEra}
        onActsChange={setActs}
      />

      {/* Location picker */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-jade" />
            {t("create.locationTitle")}
          </CardTitle>
          <CardDescription>{t("create.locationDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedLocations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedLocations.map((name) => (
                <Badge key={name} variant="secondary" className="gap-1 pl-2">
                  {name}
                  <button
                    onClick={() => toggleLocation(name)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                    aria-label={t("common.delete")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder={t("create.locationPlaceholder")}
          />
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            {filteredLocations.map((loc) => {
              const selected = selectedLocations.includes(loc.name);
              return (
                <button
                  key={loc.id}
                  onClick={() => toggleLocation(loc.name)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-accent"
                  }`}
                >
                  {loc.name}
                </button>
              );
            })}
            {filteredLocations.length === 0 && locationQuery && (
              <p className="text-xs text-muted-foreground">{t("create.locationEmpty")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <Button
          variant="ghost"
          className="gap-1 text-sm text-muted-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {t("create.advanced")}
        </Button>
        {showAdvanced && (
          <div className="mt-2">
            <Textarea
              placeholder={t("create.advancedPlaceholder")}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1 gap-2"
          onClick={handleGenerate}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t("create.generating")}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t("create.generate")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
