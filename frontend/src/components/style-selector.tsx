"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Heart, Laugh, Frown } from "lucide-react";

interface StyleSelectorProps {
  style: string;
  era: string;
  acts: string;
  onStyleChange: (style: string) => void;
  onEraChange: (era: string) => void;
  onActsChange: (acts: string) => void;
}

const STYLES = [
  { id: "suspense", label: "悬疑推理", icon: Search, desc: "谜团、线索、反转" },
  { id: "romance", label: "爱情故事", icon: Heart, desc: "浪漫、纠葛、感动" },
  { id: "comedy", label: "喜剧冒险", icon: Laugh, desc: "搞笑、误会、惊喜" },
  { id: "tragedy", label: "悲剧史诗", icon: Frown, desc: "壮烈、牺牲、反思" },
];

const ERAS = [
  { id: "qing", label: "清代" },
  { id: "ming", label: "民国" },
  { id: "modern", label: "现代" },
  { id: "fantasy", label: "架空" },
];

const ACT_OPTIONS = [
  { id: "3", label: "3幕" },
  { id: "5", label: "5幕" },
  { id: "7", label: "7幕" },
];

export function StyleSelector({
  style,
  era,
  acts,
  onStyleChange,
  onEraChange,
  onActsChange,
}: StyleSelectorProps) {
  return (
    <div className="space-y-6 mb-6">
      {/* Genre */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">选择风格</CardTitle>
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
                  <span className="font-medium">{s.label}</span>
                </div>
                <span className="text-xs opacity-70">{s.desc}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Era + Acts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">时代背景</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ERAS.map((e) => (
                <Button
                  key={e.id}
                  variant={era === e.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEraChange(e.id)}
                >
                  {e.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">剧本长度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ACT_OPTIONS.map((a) => (
                <Button
                  key={a.id}
                  variant={acts === a.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onActsChange(a.id)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
