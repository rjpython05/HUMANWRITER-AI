import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Database, Activity, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

// Mock data - replace with actual API calls
async function getAdminStats() {
  return {
    totalUsers: 1247,
    activeUsers: 892,
    totalGenerations: 45230,
    totalCorpusDocuments: 3421,
    systemHealth: "healthy" as const,
    avgResponseTime: 245,
    successRate: 0.98,
    storageUsed: 127.5,
  };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.activeUsers)} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalGenerations)}</div>
            <p className="text-xs text-muted-foreground">
              All-time total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corpus Documents</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalCorpusDocuments)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.storageUsed.toFixed(1)} GB storage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.successRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgResponseTime}ms avg response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current system status and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">All Systems Operational</p>
              <p className="text-sm text-muted-foreground">
                No issues detected. All services running normally.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage users and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Corpus Management</CardTitle>
            <CardDescription>Review and manage corpus documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/corpus">
              <Button className="w-full">
                <Database className="mr-2 h-4 w-4" />
                Manage Corpus
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
            <CardDescription>View detailed analytics and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/metrics">
              <Button className="w-full">
                <Activity className="mr-2 h-4 w-4" />
                View Metrics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: "user", message: "New user registration: john@example.com", time: "2 minutes ago" },
              { type: "generation", message: "Generation completed: Biology (1,200 words)", time: "5 minutes ago" },
              { type: "corpus", message: "New corpus document uploaded: chemistry_paper.pdf", time: "12 minutes ago" },
              { type: "user", message: "User upgraded to Pro plan: sarah@example.com", time: "1 hour ago" },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
