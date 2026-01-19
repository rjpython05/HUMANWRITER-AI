import { getServerSession } from "@/lib/auth";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Database, TrendingUp, Clock, ArrowRight, Plus } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";

// This would normally fetch from your API
async function getDashboardStats(userId: string) {
  // Mock data - replace with actual API call
  return {
    totalGenerations: 142,
    corpusSize: 28,
    totalWords: 45230,
    avgHumanizationScore: 0.94,
    recentGenerations: [
      {
        id: "1",
        discipline: "Biology",
        status: "COMPLETED" as const,
        createdAt: new Date(),
        metrics: { humanizationScore: 0.96, wordCount: 1200 },
      },
      {
        id: "2",
        discipline: "Chemistry",
        status: "COMPLETED" as const,
        createdAt: new Date(Date.now() - 86400000),
        metrics: { humanizationScore: 0.92, wordCount: 850 },
      },
      {
        id: "3",
        discipline: "Physics",
        status: "COMPLETED" as const,
        createdAt: new Date(Date.now() - 172800000),
        metrics: { humanizationScore: 0.95, wordCount: 1500 },
      },
    ],
  };
}

export default async function DashboardPage() {
  const session = await getServerSession();
  const stats = await getDashboardStats(session!.user.id);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session!.user.name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your HumanWriter AI activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Generations"
          value={formatNumber(stats.totalGenerations)}
          description="All-time generations"
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Corpus Documents"
          value={formatNumber(stats.corpusSize)}
          description="Training documents"
          icon={Database}
        />
        <StatsCard
          title="Words Generated"
          value={formatNumber(stats.totalWords)}
          description="Total word count"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Avg. Humanization"
          value={`${(stats.avgHumanizationScore * 100).toFixed(1)}%`}
          description="Average score"
          icon={TrendingUp}
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/generate">
              <Button className="w-full h-auto flex-col gap-2 p-6" variant="outline">
                <Plus className="h-6 w-6" />
                <span>New Generation</span>
              </Button>
            </Link>
            <Link href="/corpus">
              <Button className="w-full h-auto flex-col gap-2 p-6" variant="outline">
                <Database className="h-6 w-6" />
                <span>Upload Corpus</span>
              </Button>
            </Link>
            <Link href="/history">
              <Button className="w-full h-auto flex-col gap-2 p-6" variant="outline">
                <Clock className="h-6 w-6" />
                <span>View History</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Generations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Generations</CardTitle>
              <CardDescription>Your latest humanized texts</CardDescription>
            </div>
            <Link href="/history">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentGenerations.map((generation) => (
              <Link
                key={generation.id}
                href={`/generate/${generation.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{generation.discipline}</p>
                      <p className="text-sm text-muted-foreground">
                        {generation.metrics.wordCount} words • {formatDate(generation.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {(generation.metrics.humanizationScore * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Humanization</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Pro Tip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Upload more corpus documents in your target discipline to improve humanization
            accuracy. Documents should be authentic human-written academic texts.
          </p>
          <Link href="/corpus">
            <Button className="mt-4" size="sm">
              Upload Corpus <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
