"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Activity, Zap, TrendingUp, CheckCircle2 } from "lucide-react"

interface MetricsDisplayProps {
  metrics: {
    burstiness?: number
    humanizationScore?: number
    aiWordsCount?: number
    perplexity?: number
    coherenceScore?: number
    readabilityScore?: number
  }
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as const, label: "Excellent" }
    if (score >= 60) return { variant: "secondary" as const, label: "Good" }
    return { variant: "destructive" as const, label: "Needs Improvement" }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.humanizationScore !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humanization Score</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.humanizationScore}%</div>
            <Progress value={metrics.humanizationScore} className="mt-2" />
            <div className="mt-2">
              <Badge {...getScoreBadge(metrics.humanizationScore)}>
                {getScoreBadge(metrics.humanizationScore).label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {metrics.burstiness !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Burstiness</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.burstiness.toFixed(2)}</div>
            <Progress value={(metrics.burstiness / 10) * 100} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Variation in sentence length (higher is more human-like)
            </p>
          </CardContent>
        </Card>
      )}

      {metrics.perplexity !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perplexity</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.perplexity.toFixed(2)}</div>
            <Progress value={Math.min((metrics.perplexity / 100) * 100, 100)} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Text unpredictability (higher indicates less AI-like)
            </p>
          </CardContent>
        </Card>
      )}

      {metrics.coherenceScore !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coherence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.coherenceScore}%</div>
            <Progress value={metrics.coherenceScore} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Logical flow and consistency
            </p>
          </CardContent>
        </Card>
      )}

      {metrics.readabilityScore !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Readability</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.readabilityScore}%</div>
            <Progress value={metrics.readabilityScore} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Text clarity and ease of reading
            </p>
          </CardContent>
        </Card>
      )}

      {metrics.aiWordsCount !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Words Detected</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.aiWordsCount}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Words commonly associated with AI-generated text
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
