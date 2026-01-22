import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "./use-toast";

export interface UserStats {
  totalGenerations: number;
  totalWords: number;
  averageSafetyScore: number;
  generationsThisMonth: number;
}

export function useUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<UserStats>("/api/users/stats");
      setStats(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch stats",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateProfile = useCallback(
    async (data: { name?: string; email?: string }) => {
      try {
        await apiClient.patch("/api/users/profile", data);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to update profile",
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast]
  );

  return {
    isLoading,
    stats,
    fetchStats,
    updateProfile,
  };
}
