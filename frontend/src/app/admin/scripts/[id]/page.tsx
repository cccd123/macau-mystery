"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { ScriptEditor } from "@/components/script-editor";

export default function EditScriptPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">编辑剧本</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>剧本标题</Label>
              <Input defaultValue="跨越中葡的悬案" />
            </div>
            <div>
              <Label>剧本描述</Label>
              <Textarea defaultValue="玩家扮演文物修复师，沿澳门历史城区破解一个跨越中葡两个家族的悬案" />
            </div>
          </CardContent>
        </Card>

        <ScriptEditor />

        <div className="flex gap-3 justify-end">
          <Link href="/admin">
            <Button variant="outline">取消</Button>
          </Link>
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            保存更新
          </Button>
        </div>
      </div>
    </div>
  );
}
