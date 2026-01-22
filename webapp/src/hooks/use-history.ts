import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "./use-toast";

export interface HistoryItem {
  id: string;
  discipline: string;
  prompt: string;
  content: string;
  wordCount: number;
  safetyScore?: number;
  createdAt: string;
  updatedAt: string;
}

export function useHistory() {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<HistoryItem[]>("/api/generations");
      setItems(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`/api/generations/${id}`);
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast({
          title: "Success",
          description: "Generation deleted successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to delete generation",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  return {
    isLoading,
    items,
    fetchHistory,
    deleteItem,
  };
}
