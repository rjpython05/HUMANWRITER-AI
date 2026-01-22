"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DisciplineSelector } from "./discipline-selector";
import { ParameterControls } from "./parameter-controls";

interface GenerationFormProps {
  onGenerate: (data: GenerationData) => void;
  isGenerating: boolean;
}

export interface GenerationData {
  discipline: string;
  prompt: string;
  maxWords: number;
  temperature: number;
  model: string;
}

export function GenerationForm({ onGenerate, isGenerating }: GenerationFormProps) {
  const [discipline, setDiscipline] = useState("");
  const [prompt, setPrompt] = useState("");
  const [maxWords, setMaxWords] = useState(1000);
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState("gpt-4");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discipline || !prompt.trim()) return;

    onGenerate({
      discipline,
      prompt,
      maxWords,
      temperature,
      model,
    });
  };

  const canGenerate = discipline && prompt.trim() && !isGenerating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Discipline</CardTitle>
        </CardHeader>
        <CardContent>
          <DisciplineSelector value={discipline} onChange={setDiscipline} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="prompt">
              Describe what you want to generate
            </Label>
            <Textarea
              id="prompt"
              placeholder="Example: Write a research paper introduction about renewable energy sources, focusing on solar and wind power..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about the topic, style, and key points you want to include
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <ParameterControls
            maxWords={maxWords}
            temperature={temperature}
            model={model}
            onMaxWordsChange={setMaxWords}
            onTemperatureChange={setTemperature}
            onModelChange={setModel}
          />
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!canGenerate}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Text"
        )}
      </Button>
    </form>
  );
}
