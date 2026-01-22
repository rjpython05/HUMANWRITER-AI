"use client";

import { useState } from "react";
import { GenerationForm, GenerationData } from "@/components/generation/generation-form";
import { StreamingOutput } from "@/components/generation/streaming-output";
import { ExportDialog } from "@/components/generation/export-dialog";
import { VerificationDialog } from "@/components/verification/verification-dialog";
import { useGeneration } from "@/hooks/use-generation";
import { useVerification } from "@/hooks/use-verification";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";

export default function GeneratePage() {
  const { isGenerating, streamingContent, result, generate, humanize } = useGeneration();
  const { verify, result: verificationResult } = useVerification();
  const { toast } = useToast();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const handleGenerate = async (data: GenerationData) => {
    try {
      await generate(data);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRehumanize = async () => {
    if (!streamingContent) return;
    try {
      await humanize(streamingContent);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleVerify = async () => {
    if (!streamingContent) return;
    try {
      await verify(streamingContent);
      setShowVerificationDialog(true);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleExport = async (format: string) => {
    if (!streamingContent) return;

    try {
      if (format === "txt") {
        const blob = new Blob([streamingContent], { type: "text/plain;charset=utf-8" });
        saveAs(blob, "humanwriter-generation.txt");
      } else if (format === "docx") {
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: [
                new Paragraph({
                  children: [
                    new TextRun(streamingContent),
                  ],
                }),
              ],
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "humanwriter-generation.docx");
      } else if (format === "pdf") {
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(streamingContent, 180);
        doc.text(lines, 15, 15);
        doc.save("humanwriter-generation.pdf");
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Academic Text</h1>
        <p className="text-muted-foreground mt-2">
          Create 100% undetectable human-like academic writing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <GenerationForm
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        <div>
          <StreamingOutput
            content={streamingContent}
            isStreaming={isGenerating}
            metrics={
              result
                ? {
                    wordCount: result.wordCount,
                    burstiness: result.burstiness,
                    humanizationScore: result.humanizationScore,
                  }
                : undefined
            }
            onRehumanize={handleRehumanize}
            onVerify={handleVerify}
            onExport={() => setShowExportDialog(true)}
          />
        </div>
      </div>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        content={streamingContent}
        onExport={handleExport}
      />

      <VerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        result={verificationResult}
      />
    </div>
  );
}
