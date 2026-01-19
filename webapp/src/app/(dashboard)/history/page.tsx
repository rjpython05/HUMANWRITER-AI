"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/utils";
import { Search, Filter, Eye, Download, Trash2 } from "lucide-react";
import { DISCIPLINES } from "@/types/corpus";
import { GenerationStatus } from "@/types/generation";

// Mock data - replace with actual API call
const mockGenerations = [
  {
    id: "1",
    discipline: "Biology",
    mode: "prompt",
    status: "COMPLETED" as GenerationStatus,
    createdAt: new Date(),
    metrics: { humanizationScore: 0.96, wordCount: 1200 },
  },
  {
    id: "2",
    discipline: "Chemistry",
    mode: "document",
    status: "COMPLETED" as GenerationStatus,
    createdAt: new Date(Date.now() - 86400000),
    metrics: { humanizationScore: 0.92, wordCount: 850 },
  },
  {
    id: "3",
    discipline: "Physics",
    mode: "prompt",
    status: "COMPLETED" as GenerationStatus,
    createdAt: new Date(Date.now() - 172800000),
    metrics: { humanizationScore: 0.95, wordCount: 1500 },
  },
  {
    id: "4",
    discipline: "Mathematics",
    mode: "prompt",
    status: "FAILED" as GenerationStatus,
    createdAt: new Date(Date.now() - 259200000),
    metrics: null,
  },
];

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredGenerations = mockGenerations.filter((gen) => {
    const matchesSearch = search === "" || gen.discipline.toLowerCase().includes(search.toLowerCase());
    const matchesDiscipline = disciplineFilter === "all" || gen.discipline === disciplineFilter;
    const matchesStatus = statusFilter === "all" || gen.status === statusFilter;
    return matchesSearch && matchesDiscipline && matchesStatus;
  });

  const getStatusBadge = (status: GenerationStatus) => {
    const styles = {
      COMPLETED: "bg-green-100 text-green-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      FAILED: "bg-red-100 text-red-800",
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generation History</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all your text generations
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter your generations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by discipline..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Disciplines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disciplines</SelectItem>
                {DISCIPLINES.map((discipline) => (
                  <SelectItem key={discipline.value} value={discipline.value}>
                    {discipline.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generations</CardTitle>
              <CardDescription>
                {filteredGenerations.length} generation(s) found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Discipline</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Words</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGenerations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No generations found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGenerations.map((generation) => (
                    <TableRow key={generation.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {generation.discipline}
                      </TableCell>
                      <TableCell className="capitalize">{generation.mode}</TableCell>
                      <TableCell>{getStatusBadge(generation.status)}</TableCell>
                      <TableCell>
                        {generation.metrics
                          ? `${(generation.metrics.humanizationScore * 100).toFixed(1)}%`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {generation.metrics
                          ? formatNumber(generation.metrics.wordCount)
                          : "—"}
                      </TableCell>
                      <TableCell>{formatDate(generation.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/generate/${generation.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
