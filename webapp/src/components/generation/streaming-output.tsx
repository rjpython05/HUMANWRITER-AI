"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy, Download, RefreshCw, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StreamingOutputProps {
  content: string;
  isStreaming: boolean;
  metrics?: {
    wordCount: number;
    burstiness?: number;
    humanizationScore?: number;
  };
  onRehumanize?: () => void;
  onVerify?: () => void;
  onExport?: () => void;
}

export function StreamingOutput({
  content,
  isStreaming,
  metrics,
  onRehumanize,
  onVerify,
  onExport,
}: StreamingOutputProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Generated Text</CardTitle>
          {metrics && (
            <div className="flex gap-2">
              <Badge variant="outline">{metrics.wordCount} words</Badge>
              {metrics.humanizationScore && (
                <Badge
                  variant={metrics.humanizationScore >= 80 ? "success" : "warning"}
                >
                  {metrics.humanizationScore}% human
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!content && !isStreaming ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Your generated text will appear here...</p>
          </div>
        ) : (
          <>
            <div className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 rounded-md border bg-muted/50">
              {isStreaming && !content ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{content}</p>
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              )}
            </div>

            {content && !isStreaming && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                {onRehumanize && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRehumanize}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-humanize
                  </Button>
                )}
                {onVerify && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onVerify}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Verify AI
                  </Button>
                )}
                {onExport && (
                  <Button
                    size="sm"
                    onClick={onExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
