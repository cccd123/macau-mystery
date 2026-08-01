"use client";

import { useState } from "react";
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
import { StyleSelector } from "@/components/style-selector";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { ugcApi } from "@/lib/api";

export default function CreatePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("suspense");
  const [era, setEra] = useState("qing");
  const [acts, setActs] = useState("3");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await ugcApi.generate(input, style, {
        era,
        acts: parseInt(acts),
        custom_prompt: customPrompt || undefined,
      });
      // Store result in sessionStorage for the result page
      sessionStorage.setItem("generatedScript", JSON.stringify(res));
      router.push("/create/result");
    } catch (e: any) {
      setError("Generation failed: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">一句话写短剧</h1>
      <p className="text-muted-foreground mb-8">
        输入一句话描述，AI自动生成完整的互动短剧剧本
      </p>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">你的故事概念</CardTitle>
          <CardDescription>
            例如："清朝商人在澳门的爱情故事"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="用一句话描述你想要的故事..."
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

      <div className="mb-6">
        <Button
          variant="ghost"
          className="gap-1 text-sm text-muted-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          高级选项（自定义提示词）
        </Button>
        {showAdvanced && (
          <div className="mt-2">
            <Textarea
              placeholder={"Add extra instructions here"}
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
              AI生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              生成短剧
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
