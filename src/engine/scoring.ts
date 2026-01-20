/**
 * Motologix - Scoring Engine
 *
 * Pure mathematical scoring using weighted formula.
 * No AI involvement - completely deterministic.
 *
 * Formula: Final Score = Σ(Factor Score × Factor Weight) × 10
 */

import type {
  FactorScores,
  FactorWeights,
  FactorKey,
  ScoredMotorcycle,
  Motorcycle,
  PillionMode,
} from "@/types";
import { DEFAULT_WEIGHTS } from "@/types";
import { normalizeMotorcycle, getFactorConfidences } from "./normalizer";

/**
 * Calculate the weighted final score (0-100)
 */
export function calculateFinalScore(
  factorScores: FactorScores,
  weights: FactorWeights
): number {
  const factorKeys: FactorKey[] = [
    "dailyTrafficEase",
    "brakingSafetyConfidence",
    "primaryPillionComfort",
    "highwayStability",
    "riderComfort",
    "suspensionCompliance",
    "funEngagement",
    "heatManagement",
    "ownershipPracticality",
    "longTermSuitability",
  ];

  let weightedSum = 0;
  let totalWeight = 0;

  for (const key of factorKeys) {
    const score = factorScores[key];
    const weight = weights[key];
    weightedSum += score * weight;
    totalWeight += weight;
  }

  // Normalize weights to 1.0 if they don't sum to 1
  const normalizedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Convert from 1-10 scale to 0-100 scale
  return Math.round(normalizedScore * 10);
}

/**
 * Validate that weights sum to approximately 1.0
 */
export function validateWeights(weights: FactorWeights): boolean {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  return Math.abs(total - 1.0) < 0.01; // Allow small floating point errors
}

/**
 * Normalize weights to sum to 1.0
 */
export function normalizeWeights(weights: FactorWeights): FactorWeights {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);

  if (total === 0) return { ...DEFAULT_WEIGHTS };

  const normalized: FactorWeights = { ...weights };
  const factorKeys = Object.keys(weights) as FactorKey[];

  for (const key of factorKeys) {
    normalized[key] = weights[key] / total;
  }

  return normalized;
}

/**
 * Score a single motorcycle
 */
export function scoreMotorcycle(
  motorcycle: Motorcycle,
  weights: FactorWeights,
  pillionMode: PillionMode = "primary"
): ScoredMotorcycle {
  // Ensure weights are normalized
  const normalizedWeights = normalizeWeights(weights);

  // Get factor scores from normalization engine
  const factorScores = normalizeMotorcycle(motorcycle, pillionMode);

  // Calculate final weighted score
  const finalScore = calculateFinalScore(factorScores, normalizedWeights);

  // Get confidence levels for each factor
  const confidences = getFactorConfidences(motorcycle);

  return {
    motorcycle,
    factorScores,
    finalScore,
    rank: 0, // Will be set during ranking
    confidences,
  };
}

/**
 * Score and rank multiple motorcycles
 */
export function scoreAndRankMotorcycles(
  motorcycles: Motorcycle[],
  weights: FactorWeights,
  pillionMode: PillionMode = "primary"
): ScoredMotorcycle[] {
  // Score all motorcycles
  const scoredBikes = motorcycles.map((bike) =>
    scoreMotorcycle(bike, weights, pillionMode)
  );

  // Sort by final score (descending)
  scoredBikes.sort((a, b) => b.finalScore - a.finalScore);

  // Assign ranks (1-based, handle ties)
  let currentRank = 1;
  for (let i = 0; i < scoredBikes.length; i++) {
    if (i > 0 && scoredBikes[i].finalScore < scoredBikes[i - 1].finalScore) {
      currentRank = i + 1;
    }
    scoredBikes[i].rank = currentRank;
  }

  return scoredBikes;
}

/**
 * Get the score breakdown as a formatted object
 */
export function getScoreBreakdown(
  scoredBike: ScoredMotorcycle,
  weights: FactorWeights
): Array<{
  factor: FactorKey;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
  confidence: "high" | "medium" | "low";
}> {
  const factorLabels: Record<FactorKey, string> = {
    dailyTrafficEase: "Daily Traffic Ease",
    brakingSafetyConfidence: "Braking & Safety",
    primaryPillionComfort: "Pillion Comfort",
    highwayStability: "Highway Stability",
    riderComfort: "Rider Comfort",
    suspensionCompliance: "Suspension Quality",
    funEngagement: "Fun & Engagement",
    heatManagement: "Heat Management",
    ownershipPracticality: "Ownership Practicality",
    longTermSuitability: "Long-Term Suitability",
  };

  const normalizedWeights = normalizeWeights(weights);
  const entries: Array<{
    factor: FactorKey;
    label: string;
    score: number;
    weight: number;
    weightedScore: number;
    confidence: "high" | "medium" | "low";
  }> = [];

  for (const factor of Object.keys(factorLabels) as FactorKey[]) {
    const score = scoredBike.factorScores[factor];
    const weight = normalizedWeights[factor];
    entries.push({
      factor,
      label: factorLabels[factor],
      score,
      weight,
      weightedScore: Math.round(score * weight * 100) / 10, // contribution to final score
      confidence: scoredBike.confidences[factor],
    });
  }

  // Sort by weighted contribution (descending)
  return entries.sort((a, b) => b.weightedScore - a.weightedScore);
}

/**
 * Compare two scored motorcycles and identify key differences
 */
export function compareScores(
  bike1: ScoredMotorcycle,
  bike2: ScoredMotorcycle
): Array<{
  factor: FactorKey;
  label: string;
  bike1Score: number;
  bike2Score: number;
  difference: number;
  winner: "bike1" | "bike2" | "tie";
}> {
  const factorLabels: Record<FactorKey, string> = {
    dailyTrafficEase: "Daily Traffic Ease",
    brakingSafetyConfidence: "Braking & Safety",
    primaryPillionComfort: "Pillion Comfort",
    highwayStability: "Highway Stability",
    riderComfort: "Rider Comfort",
    suspensionCompliance: "Suspension Quality",
    funEngagement: "Fun & Engagement",
    heatManagement: "Heat Management",
    ownershipPracticality: "Ownership Practicality",
    longTermSuitability: "Long-Term Suitability",
  };

  const comparisons: Array<{
    factor: FactorKey;
    label: string;
    bike1Score: number;
    bike2Score: number;
    difference: number;
    winner: "bike1" | "bike2" | "tie";
  }> = [];

  for (const factor of Object.keys(factorLabels) as FactorKey[]) {
    const score1 = bike1.factorScores[factor];
    const score2 = bike2.factorScores[factor];
    const diff = score1 - score2;

    comparisons.push({
      factor,
      label: factorLabels[factor],
      bike1Score: score1,
      bike2Score: score2,
      difference: Math.abs(diff),
      winner: diff > 0.25 ? "bike1" : diff < -0.25 ? "bike2" : "tie",
    });
  }

  // Sort by absolute difference (descending) to show biggest differences first
  return comparisons.sort((a, b) => b.difference - a.difference);
}
