"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, Sparkles, PenTool } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Script {
  id: string;
  title: string;
  description?: string;
  status: string;
  chapters_count: number;
  players_count: number;
  created_at: string;
}

export default function AdminPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listScripts();
      setScripts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirm delete?")) return;
    try {
      await adminApi.deleteScript(id);
      setScripts((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      await adminApi.publishScript(id);
      setScripts((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: currentStatus === "published" ? "draft" : "published",
              }
            : s
        )
      );
    } catch (e: any) {
      alert("Publish toggle failed: " + e.message);
    }
  };

  const published = scripts.filter((s) => s.status === "published").length;
  const totalPlayers = scripts.reduce((sum, s) => sum + (s.players_count || 0), 0);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage scripts, review submissions</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/scripts/ai-create">
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Quick Create
            </Button>
          </Link>
          <Link href="/admin/scripts/new">
            <Button className="gap-2">
              <PenTool className="h-4 w-4" />
              Manual Create
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Scripts", value: scripts.length },
          { label: "Total Players", value: totalPlayers },
          { label: "Published", value: published },
          { label: "Drafts", value: scripts.length - published },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Scripts List */}
      <Card>
        <CardHeader>
          <CardTitle>Script List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">{error}</p>
              <Button variant="outline" onClick={fetchScripts}>
                Retry
              </Button>
            </div>
          ) : scripts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scripts yet. Create your first one!
            </div>
          ) : (
            <div className="space-y-3">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{script.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {script.chapters_count} chapters | {script.players_count}{" "}
                        players | {script.created_at}
                      </p>
                    </div>
                    <Badge
                      variant={
                        script.status === "published" ? "default" : "secondary"
                      }
                    >
                      {script.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/scripts/${script.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleTogglePublish(script.id, script.status)
                      }
                    >
                      {script.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(script.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* UGC Submissions Review Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>User Submissions (Review)</CardTitle>
          <CardDescription>
            Review user-created scripts submitted for official adoption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            No pending submissions
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
