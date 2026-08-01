"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MapViewer = dynamic(() => import("@/components/map-viewer"), {
  ssr: false,
});

const LOCATIONS = [
  { id: "1", name: "妈阁庙", lat: 22.1867, lng: 113.5318, status: "current" as const, description: "澳门现存最古老的庙宇之一" },
  { id: "2", name: "亚婆井前地", lat: 22.1876, lng: 113.5331, status: "locked" as const, description: "葡萄牙人在澳门最早的聚居点" },
  { id: "3", name: "郑家大屋", lat: 22.1879, lng: 113.5347, status: "locked" as const, description: "晚清思想家郑观应故居" },
  { id: "4", name: "岗顶剧院", lat: 22.1892, lng: 113.5389, status: "locked" as const, description: "中国现存最古老的西式剧院" },
  { id: "5", name: "议事亭前地", lat: 22.1918, lng: 113.5396, status: "locked" as const, description: "澳门的城市中心广场" },
  { id: "6", name: "大三巴牌坊", lat: 22.1946, lng: 113.5414, status: "locked" as const, description: "澳门最著名的地标建筑" },
];

export default function MapPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">探案路线地图</h1>
      <p className="text-muted-foreground mb-6">
        沿澳门历史城区真实游览动线，全程约2.5公里
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Map */}
        <div className="h-[400px] md:h-[600px] rounded-lg overflow-hidden border">
          <MapViewer locations={LOCATIONS} />
        </div>

        {/* Location list */}
        <div className="space-y-3">
          {LOCATIONS.map((loc, i) => (
            <Card key={loc.id} className={loc.status === "locked" ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={loc.status === "current" ? "default" : "outline"}>
                    {i + 1}
                  </Badge>
                  <CardTitle className="text-base">{loc.name}</CardTitle>
                  {loc.status === "current" && (
                    <Badge variant="secondary">当前位置</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{loc.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
