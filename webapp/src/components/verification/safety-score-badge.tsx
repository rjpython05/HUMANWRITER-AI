'use client';

import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface SafetyScoreBadgeProps {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function SafetyScoreBadge({
  score,
  riskLevel,
  size = 'md',
  showLabel = true,
  className,
}: SafetyScoreBadgeProps) {
  const getColorClasses = () => {
    switch (riskLevel) {
      case 'LOW':
        return {
          bg: 'bg-green-100 dark:bg-green-900/20',
          text: 'text-green-700 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800',
          icon: CheckCircle,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/20',
          text: 'text-yellow-700 dark:text-yellow-400',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: AlertTriangle,
        };
      case 'HIGH':
        return {
          bg: 'bg-red-100 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800',
          icon: XCircle,
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/20',
          text: 'text-gray-700 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-800',
          icon: Shield,
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'h-3 w-3',
          score: 'text-xs',
        };
      case 'md':
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'h-4 w-4',
          score: 'text-sm',
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'h-5 w-5',
          score: 'text-lg',
        };
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'h-4 w-4',
          score: 'text-sm',
        };
    }
  };

  const getRiskLabel = () => {
    switch (riskLevel) {
      case 'LOW':
        return 'Safe';
      case 'MEDIUM':
        return 'Moderate Risk';
      case 'HIGH':
        return 'High Risk';
      default:
        return 'Unknown';
    }
  };

  const colors = getColorClasses();
  const sizes = getSizeClasses();
  const Icon = colors.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-2 rounded-full border font-semibold',
        colors.bg,
        colors.text,
        colors.border,
        sizes.container,
        className
      )}
    >
      <Icon className={sizes.icon} />
      <div className="flex items-center space-x-2">
        <span className={cn('font-bold', sizes.score)}>{score.toFixed(0)}</span>
        {showLabel && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className={sizes.score}>100</span>
            {size !== 'sm' && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className={sizes.score}>{getRiskLabel()}</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface SafetyScoreCardProps {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence?: number;
  className?: string;
}

export function SafetyScoreCard({
  score,
  riskLevel,
  confidence,
  className,
}: SafetyScoreCardProps) {
  const getColorClasses = () => {
    switch (riskLevel) {
      case 'LOW':
        return {
          gradient: 'from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-900/20',
          text: 'text-green-700 dark:text-green-400',
          progressBg: 'bg-green-200 dark:bg-green-900/30',
          progressFill: 'bg-green-500 dark:bg-green-400',
        };
      case 'MEDIUM':
        return {
          gradient: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/10 dark:to-yellow-900/20',
          text: 'text-yellow-700 dark:text-yellow-400',
          progressBg: 'bg-yellow-200 dark:bg-yellow-900/30',
          progressFill: 'bg-yellow-500 dark:bg-yellow-400',
        };
      case 'HIGH':
        return {
          gradient: 'from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-900/20',
          text: 'text-red-700 dark:text-red-400',
          progressBg: 'bg-red-200 dark:bg-red-900/30',
          progressFill: 'bg-red-500 dark:bg-red-400',
        };
      default:
        return {
          gradient: 'from-gray-50 to-gray-100 dark:from-gray-900/10 dark:to-gray-900/20',
          text: 'text-gray-700 dark:text-gray-400',
          progressBg: 'bg-gray-200 dark:bg-gray-900/30',
          progressFill: 'bg-gray-500 dark:bg-gray-400',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div
      className={cn(
        'p-6 rounded-lg bg-gradient-to-br border',
        colors.gradient,
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Safety Score</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={cn('text-4xl font-bold', colors.text)}>
              {score.toFixed(0)}
            </span>
            <span className="text-xl text-muted-foreground">/100</span>
          </div>
        </div>
        <SafetyScoreBadge
          score={score}
          riskLevel={riskLevel}
          size="md"
          showLabel={false}
        />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className={cn('w-full rounded-full h-2', colors.progressBg)}>
          <div
            className={cn('h-2 rounded-full transition-all duration-500', colors.progressFill)}
            style={{ width: `${score}%` }}
          />
        </div>

        {confidence !== undefined && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Risk Level: {riskLevel}</span>
            <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MiniSafetyScoreProps {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  className?: string;
}

export function MiniSafetyScore({ score, riskLevel, className }: MiniSafetyScoreProps) {
  const getColorClass = () => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-600 dark:text-green-400';
      case 'MEDIUM':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'HIGH':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={cn('inline-flex items-center space-x-1', className)}>
      <Shield className="h-3 w-3" />
      <span className={cn('text-xs font-semibold', getColorClass())}>
        {score.toFixed(0)}
      </span>
    </div>
  );
}
