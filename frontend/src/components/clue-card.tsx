import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface ClueCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  collected: boolean;
  icon: string;
}

export function ClueCard({
  title,
  description,
  location,
  collected,
  icon,
}: ClueCardProps) {
  return (
    <Card
      className={`transition-all ${
        collected
          ? "hover:shadow-md cursor-pointer"
          : "opacity-50 grayscale"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{collected ? icon : ""}</span>
          {!collected && <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
        <CardTitle className="text-sm">
          {collected ? title : "未解锁"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {collected ? description : "继续探索以解锁此线索"}
        </p>
        {collected && (
          <Badge variant="outline" className="mt-2 text-xs">
            {location}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
