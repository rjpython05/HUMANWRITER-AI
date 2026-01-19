'use client';

import React, { useState } from 'react';
import {
  Search,
  FileText,
  Upload,
  AlertCircle,
  Download,
  Loader2,
  Copy,
  CheckCircle,
} from 'lucide-react';
import PlagiarismReport from '@/components/plagiarism/plagiarism-report';
import SourceMatches from '@/components/plagiarism/source-matches';

interface PlagiarismCheckResult {
  reportId: string;
  overallSimilarity: number;
  similarityPercentage: number;
  riskLevel: 'SAFE' | 'MODERATE' | 'HIGH';
  summary: string;
  topSources: any[];
  statistics: any;
  exactMatchesCount: number;
  highlightedPassages: any[];
  processingTimeMs: number;
  createdAt?: string;
}

export default function PlagiarismCheckPage() {
  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<PlagiarismCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCheck = async () => {
    if (text.length < 100) {
      setError('Text must be at least 100 characters long');
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/plagiarism/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          topSources: 5,
          similarityThreshold: 0.25,
          includePassages: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check plagiarism');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while checking plagiarism');
    } finally {
      setIsChecking(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      setError('Please upload a .txt file');
      return;
    }

    try {
      const content = await file.text();
      setText(content);
      setError(null);
    } catch (err) {
      setError('Failed to read file');
    }
  };

  const handleExport = async (format: 'json' | 'text' | 'html') => {
    if (!result) return;

    try {
      const response = await fetch('/api/plagiarism/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: result.reportId,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plagiarism_report_${result.reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to export report');
    }
  };

  const copyReportId = () => {
    if (result?.reportId) {
      navigator.clipboard.writeText(result.reportId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Plagiarism Check</h1>
        <p className="text-gray-600">
          Check your text against our academic corpus to identify potential similarities and sources
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Enter Text</span>
          </h2>
          <label className="cursor-pointer flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
            <Upload className="h-4 w-4" />
            <span>Upload .txt file</span>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here (minimum 100 characters)..."
          className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            {text.length} characters | {text.split(/\s+/).filter(Boolean).length} words
          </div>
          <button
            onClick={handleCheck}
            disabled={isChecking || text.length < 100}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Check Plagiarism</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Report ID:</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {result.reportId}
                </code>
                <button
                  onClick={copyReportId}
                  className="text-gray-500 hover:text-gray-700"
                  title="Copy Report ID"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Export:</span>
                <button
                  onClick={() => handleExport('json')}
                  className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleExport('text')}
                  className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
                >
                  Text
                </button>
                <button
                  onClick={() => handleExport('html')}
                  className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
                >
                  HTML
                </button>
              </div>
            </div>
          </div>

          {/* Report */}
          <PlagiarismReport {...result} />

          {/* Sources */}
          {result.topSources && result.topSources.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <SourceMatches
                sources={result.topSources}
                onSourceClick={(sourceId) => {
                  // Handle source click - could open modal or navigate
                  console.log('Source clicked:', sourceId);
                }}
              />
            </div>
          )}

          {/* Highlighted Passages */}
          {result.highlightedPassages && result.highlightedPassages.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Highlighted Passages</h3>
              <div className="space-y-3">
                {result.highlightedPassages.map((passage, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Passage {index + 1}
                      </span>
                      <span className="text-sm font-medium text-orange-600">
                        {(passage.similarity * 100).toFixed(1)}% similar
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{passage.text}"</p>
                    {passage.sourceMetadata?.title && (
                      <p className="text-xs text-gray-500 mt-2">
                        Source: {passage.sourceMetadata.title}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      {!result && !isChecking && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                We compare your text against our internal academic corpus using TF-IDF and vector
                similarity
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                Similarity scores below 15% are considered SAFE, 15-30% MODERATE, and above 30%
                HIGH
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                We only check against our corpus to avoid legal issues with external plagiarism
                checkers
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                Results include exact matches, paraphrased content, and source citations
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
