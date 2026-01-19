"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatFileSize, formatNumber } from "@/lib/utils";
import { Search, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import { DISCIPLINES } from "@/types/corpus";

// Mock data - replace with actual API call
const mockCorpusDocuments = [
  {
    id: "1",
    filename: "biology_research_paper.pdf",
    discipline: "Biology",
    fileSize: 2456789,
    wordCount: 8500,
    status: "COMPLETED",
    uploadedBy: "john@example.com",
    uploadedAt: new Date(),
    approved: true,
  },
  {
    id: "2",
    filename: "chemistry_thesis.docx",
    discipline: "Chemistry",
    fileSize: 1234567,
    wordCount: 12000,
    status: "PENDING",
    uploadedBy: "sarah@example.com",
    uploadedAt: new Date(Date.now() - 86400000),
    approved: false,
  },
];

export default function AdminCorpusPage() {
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");

  const filteredDocuments = mockCorpusDocuments.filter((doc) => {
    const matchesSearch = search === "" ||
      doc.filename.toLowerCase().includes(search.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(search.toLowerCase());
    const matchesDiscipline = disciplineFilter === "all" || doc.discipline === disciplineFilter;
    return matchesSearch && matchesDiscipline;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Corpus Administration</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage all corpus documents
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-2xl">{formatNumber(mockCorpusDocuments.length)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl">
              {mockCorpusDocuments.filter((d) => !d.approved).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl">
              {mockCorpusDocuments.filter((d) => d.approved).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Storage</CardDescription>
            <CardTitle className="text-2xl">
              {formatFileSize(mockCorpusDocuments.reduce((sum, d) => sum + d.fileSize, 0))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filename or user..."
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
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {filteredDocuments.length} document(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Discipline</TableHead>
                  <TableHead>Words</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {doc.filename}
                    </TableCell>
                    <TableCell>{doc.uploadedBy}</TableCell>
                    <TableCell>{doc.discipline}</TableCell>
                    <TableCell>{formatNumber(doc.wordCount)}</TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell>
                      {doc.approved ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-600">
                          <XCircle className="h-4 w-4" />
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!doc.approved && (
                          <Button variant="ghost" size="icon">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
