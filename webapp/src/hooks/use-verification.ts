import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "./use-toast";

export interface VerificationResult {
  safetyScore: number;
  detectors: {
    gptzero: { score: number; label: string };
    zerogpt: { score: number; label: string };
    copyleaks: { score: number; label: string };
    winston: { score: number; label: string };
  };
  recommendations: string[];
  timestamp: string;
}

export function useVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const verify = useCallback(
    async (text: string) => {
      try {
        setIsVerifying(true);
        setResult(null);

        const response = await apiClient.post<VerificationResult>(
          "/api/verify",
          { text }
        );

        setResult(response);

        toast({
          title: "Verification complete",
          description: `Safety score: ${response.safetyScore}%`,
          variant: response.safetyScore >= 80 ? "default" : "destructive",
        });

        return response;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to verify text",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsVerifying(false);
      }
    },
    [toast]
  );

  return {
    isVerifying,
    result,
    verify,
  };
}
