"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";

interface Scene {
  id: string;
  narration: string;
  dialogue: string;
  choices: { text: string; next: string }[];
}

interface Chapter {
  id: string;
  title: string;
  location: string;
  scenes: Scene[];
}

export function ScriptEditor() {
  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: "ch1",
      title: "序幕",
      location: "妈阁庙",
      scenes: [
        {
          id: "s1",
          narration: "场景描述...",
          dialogue: "NPC对话...",
          choices: [
            { text: "选项A", next: "s2" },
            { text: "选项B", next: "s3" },
          ],
        },
      ],
    },
  ]);

  const addChapter = () => {
    setChapters([
      ...chapters,
      {
        id: `ch${chapters.length + 1}`,
        title: `第${chapters.length + 1}幕`,
        location: "",
        scenes: [],
      },
    ]);
  };

  const addScene = (chapterIndex: number) => {
    const updated = [...chapters];
    updated[chapterIndex].scenes.push({
      id: `s${Date.now()}`,
      narration: "",
      dialogue: "",
      choices: [{ text: "", next: "" }],
    });
    setChapters(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">剧本章节</h2>
        <Button size="sm" className="gap-1" onClick={addChapter}>
          <Plus className="h-4 w-4" />
          添加章节
        </Button>
      </div>

      {chapters.map((chapter, ci) => (
        <Card key={chapter.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge>{ci + 1}</Badge>
                <CardTitle className="text-base">{chapter.title}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-xs shrink-0">地点:</Label>
                <Input
                  className="h-7 text-sm"
                  defaultValue={chapter.location}
                  placeholder="例如: 妈阁庙"
                />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chapter.scenes.map((scene, si) => (
              <div
                key={scene.id}
                className="border rounded-lg p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    场景 {si + 1}
                  </span>
                </div>
                <div>
                  <Label className="text-xs">场景描述</Label>
                  <Textarea
                    className="text-sm min-h-[60px]"
                    defaultValue={scene.narration}
                  />
                </div>
                <div>
                  <Label className="text-xs">NPC对话</Label>
                  <Textarea
                    className="text-sm min-h-[60px]"
                    defaultValue={scene.dialogue}
                  />
                </div>
                <div>
                  <Label className="text-xs">玩家选择</Label>
                  {scene.choices.map((choice, coi) => (
                    <div key={coi} className="flex gap-2 mt-1">
                      <Input
                        className="h-7 text-sm flex-1"
                        defaultValue={choice.text}
                        placeholder="选择文本"
                      />
                      <Input
                        className="h-7 text-sm w-24"
                        defaultValue={choice.next}
                        placeholder="跳转ID"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => addScene(ci)}
            >
              <Plus className="h-3 w-3" />
              添加场景
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
