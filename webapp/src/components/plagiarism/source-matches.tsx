'use client';

import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink, Users, Calendar, Building2 } from 'lucide-react';

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
  averageSimilarity?: number;
  maxSimilarity?: number;
  percentage: number;
  matchedPassages?: MatchedPassage[];
}

export interface MatchedPassage {
  originalText: string;
  matchedText: string;
  similarity: number;
  chunkId?: number;
}

export interface SourceMatchesProps {
  sources: SourceMatch[];
  onSourceClick?: (sourceId: string) => void;
  maxVisible?: number;
}

const SourceMatches: React.FC<SourceMatchesProps> = ({
  sources,
  onSourceClick,
  maxVisible = 5,
}) => {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const displayedSources = showAll ? sources : sources.slice(0, maxVisible);

  const toggleExpanded = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const getSimilarityColor = (percentage: number) => {
    if (percentage >= 70) return 'text-red-600 bg-red-50';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getSimilarityBadgeColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-red-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (sources.length === 0) {
    return (
      <div className="rounded-lg border bg-gray-50 p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No matching sources found</p>
        <p className="text-sm text-gray-500 mt-1">Your text appears to be original</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Matching Sources ({sources.length})</h3>
      </div>

      {displayedSources.map((source, index) => {
        const isExpanded = expandedSources.has(source.sourceId);
        const title = source.metadata.title || 'Untitled Document';
        const authors = source.metadata.authors || [];
        const year = source.metadata.year;
        const institution = source.metadata.institution;

        return (
          <div
            key={source.sourceId}
            className={`rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${
              index === 0 ? 'border-l-4 border-l-orange-500' : ''
            }`}
          >
            {/* Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    {index === 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        Top Match
                      </span>
                    )}
                  </div>
                  <h4
                    className="text-base font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                    onClick={() => onSourceClick && onSourceClick(source.sourceId)}
                  >
                    {title}
                  </h4>

                  {/* Metadata */}
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {authors.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{authors.join(', ')}</span>
                      </div>
                    )}
                    {year && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{year}</span>
                      </div>
                    )}
                    {institution && (
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>{institution}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Similarity Badge */}
                <div className="flex flex-col items-end space-y-2">
                  <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getSimilarityColor(source.percentage)}`}>
                    {source.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">{source.matchCount} matches</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all ${getSimilarityBadgeColor(source.percentage)}`}
                    style={{ width: `${Math.min(source.percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Expand/Collapse Button */}
              {source.matchedPassages && source.matchedPassages.length > 0 && (
                <button
                  onClick={() => toggleExpanded(source.sourceId)}
                  className="mt-3 flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span>Hide matched passages</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Show matched passages ({source.matchedPassages.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Expanded Passages */}
            {isExpanded && source.matchedPassages && (
              <div className="border-t bg-gray-50 p-4 space-y-3">
                {source.matchedPassages.map((passage, pIndex) => (
                  <div key={pIndex} className="bg-white rounded border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Passage {pIndex + 1}</span>
                      <span className="text-xs font-medium text-purple-600">
                        {(passage.similarity * 100).toFixed(1)}% similar
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Your text:</span>
                        <p className="text-gray-600 mt-1 italic bg-blue-50 p-2 rounded">
                          "{passage.originalText}"
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Matched text:</span>
                        <p className="text-gray-600 mt-1 italic bg-orange-50 p-2 rounded">
                          "{passage.matchedText}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Show More/Less Button */}
      {sources.length > maxVisible && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 px-4 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {showAll ? 'Show Less' : `Show ${sources.length - maxVisible} More Sources`}
        </button>
      )}
    </div>
  );
};

export default SourceMatches;
