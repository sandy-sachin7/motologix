"use client";

/**
 * ScoreBreakdown Component
 *
 * Shows individual factor scores as horizontal bars.
 */

import { useAppStore } from "@/store/app-store";
import type { ScoredMotorcycle, FactorKey } from "@/types";
import { FACTOR_METADATA } from "@/types";
import { getScoreBreakdown } from "@/engine/scoring";

// Score color based on value
function getScoreColor(score: number): string {
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-blue-500";
  if (score >= 4) return "bg-yellow-500";
  return "bg-red-500";
}

// Confidence indicator
function ConfidenceDot({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-green-400",
    medium: "bg-yellow-400",
    low: "bg-red-400",
  };

  return (
    <span
      className={`w-2 h-2 rounded-full ${colors[confidence]} inline-block`}
      title={`${confidence} confidence`}
    />
  );
}

interface ScoreBreakdownProps {
  scoredBike: ScoredMotorcycle;
  showAll?: boolean;
}

export function ScoreBreakdown({ scoredBike, showAll = false }: ScoreBreakdownProps) {
  const weights = useAppStore((state) => state.weights);
  const breakdown = getScoreBreakdown(scoredBike, weights);

  // Show top 5 by default, or all if showAll is true
  const displayItems = showAll ? breakdown : breakdown.slice(0, 5);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown</h4>
      <div className="space-y-2">
        {displayItems.map((item) => (
          <div key={item.factor} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ConfidenceDot confidence={item.confidence} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  ({Math.round(item.weight * 100)}%)
                </span>
                <span className="font-medium w-8 text-right">{item.score}</span>
              </div>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${getScoreColor(item.score)} transition-all duration-500`}
                style={{ width: `${item.score * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {!showAll && breakdown.length > 5 && (
        <p className="text-xs text-muted-foreground text-center">
          +{breakdown.length - 5} more factors
        </p>
      )}
    </div>
  );
}

/**
 * Compact score breakdown for comparison table
 */
export function CompactScoreBreakdown({ scoredBike }: { scoredBike: ScoredMotorcycle }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {FACTOR_METADATA.slice(0, 5).map((factor) => {
        const score = scoredBike.factorScores[factor.key as FactorKey];
        return (
          <div
            key={factor.key}
            className="text-center"
            title={`${factor.label}: ${score}/10`}
          >
            <div
              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-medium ${getScoreColor(score)} text-white`}
            >
              {score}
            </div>
          </div>
        );
      })}
    </div>
  );
}
