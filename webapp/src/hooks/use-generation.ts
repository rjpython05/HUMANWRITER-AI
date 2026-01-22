import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "./use-toast";

export interface GenerationParams {
  discipline: string;
  prompt: string;
  maxWords: number;
  temperature: number;
  model: string;
}

export interface GenerationResult {
  id: string;
  content: string;
  discipline: string;
  wordCount: number;
  burstiness?: number;
  humanizationScore?: number;
  createdAt: string;
}

export function useGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();

  const generate = useCallback(
    async (params: GenerationParams) => {
      try {
        setIsGenerating(true);
        setStreamingContent("");
        setResult(null);

        const response = await apiClient.post<GenerationResult>(
          "/api/generate",
          params
        );

        setResult(response);
        setStreamingContent(response.content);

        toast({
          title: "Success",
          description: "Text generated successfully",
        });

        return response;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to generate text",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [toast]
  );

  const regenerate = useCallback(
    async (generationId: string) => {
      try {
        setIsGenerating(true);
        const response = await apiClient.post<GenerationResult>(
          `/api/generate/${generationId}/regenerate`
        );

        setResult(response);
        setStreamingContent(response.content);

        toast({
          title: "Success",
          description: "Text regenerated successfully",
        });

        return response;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to regenerate text",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [toast]
  );

  const humanize = useCallback(
    async (text: string) => {
      try {
        setIsGenerating(true);
        const response = await apiClient.post<{ humanizedText: string }>(
          "/api/humanize",
          { text }
        );

        setStreamingContent(response.humanizedText);

        toast({
          title: "Success",
          description: "Text humanized successfully",
        });

        return response.humanizedText;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to humanize text",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [toast]
  );

  return {
    isGenerating,
    streamingContent,
    result,
    generate,
    regenerate,
    humanize,
  };
}
