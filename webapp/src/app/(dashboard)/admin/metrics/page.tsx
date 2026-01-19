"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Users, FileText, Database, Clock } from "lucide-react";
import { formatNumber } from "@/lib/utils";

// Mock chart component - in a real app, use recharts
function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminMetricsPage() {
  // Mock data - replace with actual API calls
  const disciplineStats = [
    { label: "Biology", value: 8420 },
    { label: "Chemistry", value: 6230 },
    { label: "Physics", value: 5890 },
    { label: "Computer Science", value: 4560 },
    { label: "Mathematics", value: 3210 },
  ];

  const weeklyActivity = [
    { label: "Monday", value: 1240 },
    { label: "Tuesday", value: 1580 },
    { label: "Wednesday", value: 1320 },
    { label: "Thursday", value: 1890 },
    { label: "Friday", value: 1450 },
    { label: "Saturday", value: 890 },
    { label: "Sunday", value: 760 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Metrics</h1>
        <p className="text-muted-foreground mt-2">
          Detailed analytics and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generations/Day</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+8%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245ms</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-15ms</span> from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.4%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+0.2%</span> from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generations by Discipline</CardTitle>
            <CardDescription>Top 5 disciplines by generation count</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={disciplineStats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Generations per day this week</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={weeklyActivity} />
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Average performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Avg Humanization Score
              </p>
              <p className="text-3xl font-bold">94.2%</p>
              <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "94.2%" }} />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Avg Burstiness
              </p>
              <p className="text-3xl font-bold">0.82</p>
              <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "82%" }} />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Avg Processing Time
              </p>
              <p className="text-3xl font-bold">12.5s</p>
              <p className="text-xs text-muted-foreground mt-2">
                For 1000-word documents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage & Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Storage Usage</CardTitle>
            </div>
            <CardDescription>Current storage statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Corpus Documents</span>
                <span className="text-sm text-muted-foreground">127.5 GB</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">User Uploads</span>
                <span className="text-sm text-muted-foreground">43.2 GB</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "22%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">System Data</span>
                <span className="text-sm text-muted-foreground">18.7 GB</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "10%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Usage</CardTitle>
            <CardDescription>API request statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Requests</span>
                <span className="text-2xl font-bold">1.2M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Requests/Hour</span>
                <span className="text-2xl font-bold">4,580</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-2xl font-bold text-green-600">1.6%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
