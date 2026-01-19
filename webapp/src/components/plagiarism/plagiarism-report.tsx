'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, FileText, TrendingUp, AlertTriangle } from 'lucide-react';

export interface PlagiarismReportProps {
  reportId: string;
  overallSimilarity: number;
  similarityPercentage: number;
  riskLevel: 'SAFE' | 'MODERATE' | 'HIGH';
  summary: string;
  topSources: SourceMatch[];
  statistics: PlagiarismStatistics;
  exactMatchesCount: number;
  highlightedPassages: HighlightedPassage[];
  processingTimeMs: number;
  createdAt?: string;
}

export interface SourceMatch {
  sourceId: string;
  metadata: {
    title?: string;
    authors?: string[];
    year?: number;
    institution?: string;
    discipline?: string;
  };
  matchCount: number;
  averageSimilarity: number;
  maxSimilarity: number;
  percentage: number;
  matchedPassages?: MatchedPassage[];
}

export interface MatchedPassage {
  originalText: string;
  matchedText: string;
  similarity: number;
  chunkId: number;
}

export interface HighlightedPassage {
  text: string;
  startPosition: number;
  similarity: number;
  sourceId: string;
  sourceMetadata: any;
  matchedText: string;
}

export interface PlagiarismStatistics {
  totalChunksAnalyzed: number;
  matchedChunks: number;
  coveragePercentage: number;
  uniqueSourcesFound: number;
  highSimilarityMatches: number;
  mediumSimilarityMatches: number;
  lowSimilarityMatches: number;
  averageMatchSimilarity: number;
  maximumMatchSimilarity: number;
  exactMatchesFound: number;
  exactMatchTotalWords?: number;
}

const PlagiarismReport: React.FC<PlagiarismReportProps> = ({
  reportId,
  overallSimilarity,
  similarityPercentage,
  riskLevel,
  summary,
  topSources,
  statistics,
  exactMatchesCount,
  highlightedPassages,
  processingTimeMs,
  createdAt,
}) => {
  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'SAFE':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'MODERATE':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get risk icon
  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'SAFE':
        return <CheckCircle2 className="h-6 w-6" />;
      case 'MODERATE':
        return <AlertTriangle className="h-6 w-6" />;
      case 'HIGH':
        return <XCircle className="h-6 w-6" />;
      default:
        return <AlertCircle className="h-6 w-6" />;
    }
  };

  // Get progress bar color
  const getProgressBarColor = (percentage: number) => {
    if (percentage < 15) return 'bg-green-500';
    if (percentage < 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className={`rounded-lg border-2 p-6 ${getRiskColor(riskLevel)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getRiskIcon(riskLevel)}
            <div>
              <h2 className="text-2xl font-bold">{riskLevel} Risk</h2>
              <p className="text-sm opacity-80">Report ID: {reportId}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{similarityPercentage.toFixed(1)}%</div>
            <p className="text-sm opacity-80">Overall Similarity</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-3 w-full rounded-full bg-white/50">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(
                similarityPercentage
              )}`}
              style={{ width: `${Math.min(similarityPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Summary</h3>
        </div>
        <p className="text-gray-700">{summary}</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Chunks Analyzed</div>
          <div className="text-2xl font-bold">{statistics.totalChunksAnalyzed}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Matched Chunks</div>
          <div className="text-2xl font-bold text-orange-600">{statistics.matchedChunks}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Sources Found</div>
          <div className="text-2xl font-bold text-blue-600">{statistics.uniqueSourcesFound}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Exact Matches</div>
          <div className="text-2xl font-bold text-red-600">{exactMatchesCount}</div>
        </div>
      </div>

      {/* Match Distribution */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Match Distribution</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">High Similarity (&gt;70%)</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-32 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-red-500"
                  style={{
                    width: `${(statistics.highSimilarityMatches / statistics.totalChunksAnalyzed) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium w-12 text-right">
                {statistics.highSimilarityMatches}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Medium Similarity (40-70%)</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-32 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-yellow-500"
                  style={{
                    width: `${(statistics.mediumSimilarityMatches / statistics.totalChunksAnalyzed) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium w-12 text-right">
                {statistics.mediumSimilarityMatches}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Low Similarity (&lt;40%)</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-32 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{
                    width: `${(statistics.lowSimilarityMatches / statistics.totalChunksAnalyzed) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium w-12 text-right">
                {statistics.lowSimilarityMatches}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Processing Time: {processingTimeMs}ms</span>
          {createdAt && <span>Created: {new Date(createdAt).toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
};

export default PlagiarismReport;
