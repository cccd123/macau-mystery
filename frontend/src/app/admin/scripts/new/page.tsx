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
import { ArrowLeft, Plus, Save } from "lucide-react";
import Link from "next/link";
import { ScriptEditor } from "@/components/script-editor";

export default function NewScriptPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">新建剧本</h1>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>剧本标题</Label>
              <Input
                placeholder="例如：跨越中葡的悬案"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>剧本描述</Label>
              <Textarea
                placeholder="简要描述剧本内容..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Script Editor */}
        <ScriptEditor />

        {/* Save */}
        <div className="flex gap-3 justify-end">
          <Link href="/admin">
            <Button variant="outline">取消</Button>
          </Link>
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            保存草稿
          </Button>
        </div>
      </div>
    </div>
  );
}
