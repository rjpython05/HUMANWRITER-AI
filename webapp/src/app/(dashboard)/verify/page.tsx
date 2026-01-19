'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SafetyScoreBadge, SafetyScoreCard } from '@/components/verification/safety-score-badge';
import {
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Shield,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetectorResult {
  detector: string;
  score: number;
  confidence: number;
  success: boolean;
  error_message?: string;
  details?: any;
}

interface VerificationResult {
  id: string;
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
  timestamp: string;
}

interface VerificationHistory {
  id: string;
  text: string;
  safetyScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export default function VerifyPage() {
  const [text, setText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleVerify = async () => {
    if (!text || text.length < 50) {
      setError('Text must be at least 50 characters long');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Only accept text files
    if (!file.type.startsWith('text/')) {
      setError('Please upload a text file');
      return;
    }

    try {
      const content = await file.text();
      setText(content);
      setError(null);
    } catch (err) {
      console.error('File read error:', err);
      setError('Failed to read file');
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/verify/history?limit=10');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const exportReport = () => {
    if (!verificationResult) return;

    const report = {
      verification_id: verificationResult.id,
      timestamp: verificationResult.timestamp,
      text_length: verificationResult.text_length,
      safety_score: verificationResult.safety_score,
      risk_level: verificationResult.risk_level,
      confidence: verificationResult.confidence,
      detectors: verificationResult.results,
      scores: {
        average: verificationResult.average_score,
        weighted: verificationResult.weighted_score,
        consensus: verificationResult.consensus_score,
      },
      recommendations: verificationResult.recommendations,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-report-${verificationResult.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Detection Verification</h1>
        </div>
        <p className="text-muted-foreground">
          Verify your text with multiple AI detection services to ensure it passes as human-written.
        </p>
      </div>

      <Tabs defaultValue="verify" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="verify">Verify Text</TabsTrigger>
          <TabsTrigger value="history" onClick={loadHistory}>
            History
          </TabsTrigger>
        </TabsList>

        {/* Verify Tab */}
        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enter Text to Verify</CardTitle>
              <CardDescription>
                Paste or upload text to run AI detection checks. Minimum 50 characters required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                className="resize-none font-mono text-sm"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <span className="text-sm text-muted-foreground">
                    {text.length} characters
                  </span>
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={isVerifying || text.length < 50}
                  size="lg"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify Text
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {verificationResult && (
            <div className="space-y-6">
              {/* Safety Score Card */}
              <SafetyScoreCard
                score={verificationResult.safety_score}
                riskLevel={verificationResult.risk_level}
                confidence={verificationResult.confidence}
              />

              {/* Detector Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Individual Detector Results</CardTitle>
                  <CardDescription>
                    Results from {verificationResult.successful_detectors} of{' '}
                    {verificationResult.total_detectors} AI detectors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {verificationResult.results.map((result) => (
                      <div
                        key={result.detector}
                        className={cn(
                          'p-4 rounded-lg border',
                          result.success ? 'bg-card' : 'bg-muted'
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">{result.detector}</span>
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>

                        {result.success ? (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">AI Detection</span>
                                <span
                                  className={cn(
                                    'font-bold',
                                    result.score < 30
                                      ? 'text-green-600'
                                      : result.score < 60
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                  )}
                                >
                                  {result.score.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                  className={cn(
                                    'h-2.5 rounded-full transition-all',
                                    result.score < 30
                                      ? 'bg-green-500'
                                      : result.score < 60
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  )}
                                  style={{ width: `${result.score}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {result.error_message || 'Detection failed'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Aggregated Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Aggregated Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                      <p className="text-3xl font-bold">
                        {verificationResult.average_score.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Mean of all detectors</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="text-sm text-muted-foreground mb-1">Weighted Score</p>
                      <p className="text-3xl font-bold">
                        {verificationResult.weighted_score.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Weighted by confidence
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="text-sm text-muted-foreground mb-1">Consensus</p>
                      <p className="text-3xl font-bold">
                        {verificationResult.consensus_score.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Agreement level
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {verificationResult.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {verificationResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted">
                          <span className="text-primary font-bold">•</span>
                          <span className="flex-1">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={exportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button onClick={() => setVerificationResult(null)}>
                  Verify New Text
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Verification History</CardTitle>
              <CardDescription>
                View your recent AI detection verifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{item.text.substring(0, 100)}...</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <SafetyScoreBadge
                        score={item.safetyScore}
                        riskLevel={item.riskLevel}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No verification history yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
