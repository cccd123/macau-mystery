"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, PenTool, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/lib/api";

export default function AICreatePage() {
  const router = useRouter();
  const [mode, setMode] = useState("quick");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.aiGenerateScript(input, mode);
      // Redirect to admin page after creation
      router.push("/admin");
    } catch (e: any) {
      setError("Generation failed: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>

      <h1 className="text-2xl font-bold mb-2">AI Script Creator</h1>
      <p className="text-muted-foreground mb-8">
        Two modes: Quick AI generation or polish your detailed idea
      </p>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <Tabs value={mode} onValueChange={setMode} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Quick Generate
          </TabsTrigger>
          <TabsTrigger value="polish" className="gap-2">
            <PenTool className="h-4 w-4" />
            Polish My Idea
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">One-sentence Quick Create</CardTitle>
              <CardDescription>
                AI generates a complete script from a single sentence. Great for
                brainstorming and exploration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g. 'A treasure hunt across Macau's Portuguese and Chinese communities'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                High randomness - AI will create the full story, characters, and choices
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="polish" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Polish My Detailed Idea</CardTitle>
              <CardDescription>
                You provide the full concept, AI refines and structures it into a
                playable script. Best for clear visions or client requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe your complete idea here: characters, plot, locations, endings... AI will structure it into chapters, scenes, and choices."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Low randomness - AI respects your vision and adds structure + polish
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleGenerate}
        disabled={!input.trim() || loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {mode === "quick" ? "AI Quick Generate" : "AI Polish & Structure"}
          </>
        )}
      </Button>
    </div>
  );
}
