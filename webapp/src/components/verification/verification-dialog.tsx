'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SafetyScoreBadge } from './safety-score-badge';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetectorResult {
  detector: string;
  score: number;
  confidence: number;
  success: boolean;
  error_message?: string;
}

interface VerificationResult {
  text_preview: string;
  text_length: number;
  results: DetectorResult[];
  total_detectors: number;
  successful_detectors: number;
  average_score: number;
  weighted_score: number;
  consensus_score: number;
  safety_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  recommendations: string[];
}

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onReHumanize?: () => void;
  onExport?: () => void;
}

export function VerificationDialog({
  open,
  onOpenChange,
  text,
  onReHumanize,
  onExport,
}: VerificationDialogProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const data = await response.json();
      setVerificationResult(data.data);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify text');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportWithVerification = () => {
    if (onExport) {
      onExport();
    }
    onOpenChange(false);
  };

  const handleReHumanize = () => {
    if (onReHumanize) {
      onReHumanize();
    }
    onOpenChange(false);
  };

  // Auto-verify when dialog opens
  useState(() => {
    if (open && !verificationResult && !isVerifying) {
      handleVerify();
    }
  });

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'HIGH':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getRiskMessage = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'This text appears sufficiently human-like and is safe to use.';
      case 'MEDIUM':
        return 'Some AI detection signals present. Consider re-humanizing for safer results.';
      case 'HIGH':
        return 'Strong AI detection signals detected. We recommend re-humanizing before exporting.';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">AI Detection Verification</DialogTitle>
          <DialogDescription>
            Verify your text with multiple AI detection services before exporting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Loading State */}
          {isVerifying && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Running AI detection checks...
              </p>
              <p className="text-xs text-muted-foreground">
                This may take up to 30 seconds
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isVerifying && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900">Verification Failed</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerify}
                    className="mt-3"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {verificationResult && !isVerifying && (
            <div className="space-y-6">
              {/* Safety Score */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center space-x-3">
                  {getRiskIcon(verificationResult.risk_level)}
                  <div>
                    <h4 className="font-semibold">Safety Score</h4>
                    <p className="text-sm text-muted-foreground">
                      {getRiskMessage(verificationResult.risk_level)}
                    </p>
                  </div>
                </div>
                <SafetyScoreBadge
                  score={verificationResult.safety_score}
                  riskLevel={verificationResult.risk_level}
                  size="lg"
                />
              </div>

              {/* Detector Results */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Individual Detector Results</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {verificationResult.results.map((result) => (
                    <div
                      key={result.detector}
                      className={cn(
                        'p-3 rounded-lg border',
                        result.success ? 'bg-card' : 'bg-muted'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{result.detector}</span>
                        {result.success ? (
                          <span
                            className={cn(
                              'text-xs font-semibold px-2 py-1 rounded',
                              result.score < 30
                                ? 'bg-green-100 text-green-700'
                                : result.score < 60
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {result.score.toFixed(1)}% AI
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Failed</span>
                        )}
                      </div>
                      {result.success ? (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all',
                              result.score < 30
                                ? 'bg-green-500'
                                : result.score < 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            )}
                            style={{ width: `${result.score}%` }}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {result.error_message || 'Detection failed'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Aggregated Scores */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-card text-center">
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-lg font-bold">{verificationResult.average_score.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-lg border bg-card text-center">
                  <p className="text-xs text-muted-foreground">Weighted</p>
                  <p className="text-lg font-bold">{verificationResult.weighted_score.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-lg border bg-card text-center">
                  <p className="text-xs text-muted-foreground">Consensus</p>
                  <p className="text-lg font-bold">{verificationResult.consensus_score.toFixed(0)}%</p>
                </div>
              </div>

              {/* Recommendations */}
              {verificationResult.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Recommendations</h4>
                  <ul className="space-y-2">
                    {verificationResult.recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="text-sm flex items-start space-x-2 p-2 rounded bg-muted"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {verificationResult && verificationResult.risk_level === 'HIGH' && onReHumanize && (
            <Button onClick={handleReHumanize} variant="default" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-Humanize Text
            </Button>
          )}
          {verificationResult && verificationResult.risk_level !== 'HIGH' && onExport && (
            <Button onClick={handleExportWithVerification} variant="default" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Anyway
            </Button>
          )}
          {verificationResult && verificationResult.risk_level === 'HIGH' && onExport && (
            <Button onClick={handleExportWithVerification} variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Despite Risk
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
