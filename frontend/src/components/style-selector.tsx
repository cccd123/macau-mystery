"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Heart, Laugh, Frown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface StyleSelectorProps {
  style: string;
  era: string;
  acts: string;
  onStyleChange: (style: string) => void;
  onEraChange: (era: string) => void;
  onActsChange: (acts: string) => void;
}

const STYLES = [
  { id: "suspense", icon: Search },
  { id: "romance", icon: Heart },
  { id: "comedy", icon: Laugh },
  { id: "tragedy", icon: Frown },
];

const ERAS = ["qing", "ming", "modern", "fantasy"];

const ACT_OPTIONS = ["3", "5", "7"];

export function StyleSelector({
  style,
  era,
  acts,
  onStyleChange,
  onEraChange,
  onActsChange,
}: StyleSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 mb-6">
      {/* Genre */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("style.styleLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {STYLES.map((s) => (
              <Button
                key={s.id}
                variant={style === s.id ? "default" : "outline"}
                className="h-auto py-3 flex flex-col items-start gap-1"
                onClick={() => onStyleChange(s.id)}
              >
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4" />
                  <span className="font-medium">{t(`style.${s.id}`)}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Era + Acts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("style.eraLabel")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ERAS.map((e) => (
                <Button
                  key={e}
                  variant={era === e ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEraChange(e)}
                >
                  {t(`style.${e}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("style.actsLabel")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ACT_OPTIONS.map((a) => (
                <Button
                  key={a}
                  variant={acts === a ? "default" : "outline"}
                  size="sm"
                  onClick={() => onActsChange(a)}
                >
                  {t(`style.acts${a}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
