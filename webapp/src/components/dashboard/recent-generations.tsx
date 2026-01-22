import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Generation {
  id: string;
  discipline: string;
  createdAt: Date;
  wordCount: number;
  safetyScore?: number;
}

interface RecentGenerationsProps {
  generations: Generation[];
}

export function RecentGenerations({ generations }: RecentGenerationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Generations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {generations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No generations yet. Start by creating your first text!
            </p>
          ) : (
            generations.map((gen) => (
              <Link
                key={gen.id}
                href={`/generate/${gen.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{gen.discipline}</p>
                    {gen.safetyScore && (
                      <Badge
                        variant={
                          gen.safetyScore >= 80 ? "success" : "warning"
                        }
                      >
                        {gen.safetyScore}% safe
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {gen.wordCount} words •{" "}
                    {formatDistanceToNow(new Date(gen.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
