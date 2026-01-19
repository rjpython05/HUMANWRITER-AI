"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerationForm } from "@/components/generation/generation-form";
import { GenerationResult } from "@/components/generation/generation-result";
import { useGeneration } from "@/hooks/use-generation";
import { Generation } from "@/types/generation";

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState<"prompt" | "document">("prompt");
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);
  const { isGenerating } = useGeneration();

  const handleGenerationComplete = (generation: Generation) => {
    setCurrentGeneration(generation);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Text</h1>
        <p className="text-muted-foreground mt-2">
          Create human-like academic writing from prompts or documents
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generation Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>
                Choose your input method and configure parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="prompt">From Prompt</TabsTrigger>
                  <TabsTrigger value="document">From Document</TabsTrigger>
                </TabsList>

                <TabsContent value="prompt" className="mt-6">
                  <GenerationForm
                    mode="prompt"
                    onComplete={handleGenerationComplete}
                  />
                </TabsContent>

                <TabsContent value="document" className="mt-6">
                  <GenerationForm
                    mode="document"
                    onComplete={handleGenerationComplete}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>
                Your humanized text will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="spinner w-12 h-12" />
                  <p className="text-sm text-muted-foreground">
                    Generating your text...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This may take a few moments
                  </p>
                </div>
              )}

              {!isGenerating && !currentGeneration && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <svg
                      className="h-12 w-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-medium mb-2">No generation yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Fill in the form and click generate to create your humanized text
                  </p>
                </div>
              )}

              {!isGenerating && currentGeneration && (
                <GenerationResult generation={currentGeneration} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
