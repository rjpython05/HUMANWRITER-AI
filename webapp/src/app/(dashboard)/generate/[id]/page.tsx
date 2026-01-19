import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GenerationResult } from "@/components/generation/generation-result";
import { MetricsDisplay } from "@/components/generation/metrics-display";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Download, Copy } from "lucide-react";
import Link from "next/link";
import { Generation } from "@/types/generation";

// This would normally fetch from your API
async function getGeneration(id: string): Promise<Generation | null> {
  // Mock data - replace with actual API call
  return {
    id,
    mode: "prompt",
    discipline: "Biology",
    status: "COMPLETED",
    originalText: "This is a sample AI-generated text that needs to be humanized...",
    humanizedText: "This represents a carefully crafted example of text that has been transformed through our humanization process, demonstrating the natural flow and authentic voice that characterizes genuine human writing...",
    metrics: {
      humanizationScore: 0.94,
      burstiness: 0.82,
      perplexity: 45.2,
      wordCount: 1200,
      sentenceCount: 48,
      avgSentenceLength: 25,
      vocabularyRichness: 0.76,
      readabilityScore: 68,
      processingTime: 12.5,
    },
    createdAt: new Date(),
    completedAt: new Date(),
    userId: "user-123",
  };
}

export default async function GenerationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const generation = await getGeneration(params.id);

  if (!generation) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/history">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generation Details</h1>
            <p className="text-muted-foreground mt-1">
              {generation.discipline} • {formatDate(generation.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <MetricsDisplay metrics={generation.metrics!} />

      {/* Text Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Original Text */}
        {generation.originalText && (
          <Card>
            <CardHeader>
              <CardTitle>Original Text</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{generation.originalText}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Humanized Text */}
        <Card className={generation.originalText ? "" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle>Humanized Text</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{generation.humanizedText}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mode</p>
              <p className="text-lg font-semibold capitalize mt-1">
                {generation.mode}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Discipline</p>
              <p className="text-lg font-semibold mt-1">{generation.discipline}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg font-semibold mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {generation.status}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Processing Time
              </p>
              <p className="text-lg font-semibold mt-1">
                {generation.metrics?.processingTime.toFixed(1)}s
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
