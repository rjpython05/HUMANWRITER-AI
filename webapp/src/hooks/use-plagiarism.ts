import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "./use-toast";

export interface PlagiarismMatch {
  source: string;
  similarity: number;
  matchedText: string;
  url?: string;
}

export interface PlagiarismResult {
  overallSimilarity: number;
  matches: PlagiarismMatch[];
  timestamp: string;
}

export function usePlagiarism() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const { toast } = useToast();

  const check = useCallback(
    async (text: string) => {
      try {
        setIsChecking(true);
        setResult(null);

        const response = await apiClient.post<PlagiarismResult>(
          "/api/plagiarism/check",
          { text }
        );

        setResult(response);

        toast({
          title: "Plagiarism check complete",
          description: `Similarity: ${response.overallSimilarity}%`,
          variant: response.overallSimilarity < 20 ? "default" : "destructive",
        });

        return response;
      } catch (error: any) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to check for plagiarism",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsChecking(false);
      }
    },
    [toast]
  );

  return {
    isChecking,
    result,
    check,
  };
}
