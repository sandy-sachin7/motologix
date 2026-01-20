/**
 * Motologix - AI Reasoning Agent
 *
 * Generates explanations and comparisons using Gemini.
 * All outputs include confidence labels.
 */

import type { ScoredMotorcycle, ComparisonResult, FactorWeights } from "@/types";
import { FACTOR_METADATA } from "@/types";
import { isGeminiConfigured, generateExplanation, generateComparisonExplanation } from "@/lib/gemini";
import { compareScores } from "@/engine/scoring";

// ============================================
// TYPES
// ============================================

export interface BikeExplanation {
  technicalExplanation: string;
  parentModeExplanation: string;
  tradeoffs: string[];
  strengths: string[];
  weaknesses: string[];
  confidence: "high" | "medium" | "low";
}

// ============================================
// LOCAL EXPLANATION GENERATION
// (Used when AI is unavailable or as fallback)
// ============================================

/**
 * Generate strengths based on factor scores
 */
function identifyStrengths(scoredBike: ScoredMotorcycle): string[] {
  const strengths: string[] = [];
  const scores = scoredBike.factorScores;

  if (scores.brakingSafetyConfidence >= 8) {
    strengths.push("Excellent braking and safety setup");
  } else if (scores.brakingSafetyConfidence >= 7) {
    strengths.push("Good braking confidence");
  }

  if (scores.dailyTrafficEase >= 8) {
    strengths.push("Very easy to handle in city traffic");
  } else if (scores.dailyTrafficEase >= 7) {
    strengths.push("Good city maneuverability");
  }

  if (scores.primaryPillionComfort >= 8) {
    strengths.push("Excellent for carrying a pillion");
  } else if (scores.primaryPillionComfort >= 7) {
    strengths.push("Comfortable for pillion riders");
  }

  if (scores.highwayStability >= 8) {
    strengths.push("Very stable on highways");
  } else if (scores.highwayStability >= 7) {
    strengths.push("Good highway cruising ability");
  }

  if (scores.riderComfort >= 8) {
    strengths.push("Very comfortable for long rides");
  }

  if (scores.suspensionCompliance >= 8) {
    strengths.push("Excellent suspension for rough roads");
  }

  if (scores.funEngagement >= 8) {
    strengths.push("Engaging and fun to ride");
  }

  if (scores.ownershipPracticality >= 8) {
    strengths.push("Low ownership costs and easy maintenance");
  }

  if (scores.longTermSuitability >= 8) {
    strengths.push("Well-suited for long-term ownership");
  }

  return strengths.slice(0, 4); // Limit to top 4
}

/**
 * Generate weaknesses based on factor scores
 */
function identifyWeaknesses(scoredBike: ScoredMotorcycle): string[] {
  const weaknesses: string[] = [];
  const scores = scoredBike.factorScores;

  if (scores.brakingSafetyConfidence <= 5) {
    weaknesses.push("Basic braking hardware may feel less confident");
  }

  if (scores.dailyTrafficEase <= 5) {
    weaknesses.push("Can be tiring in heavy traffic");
  }

  if (scores.primaryPillionComfort <= 5) {
    weaknesses.push("Pillion comfort could be better");
  }

  if (scores.highwayStability <= 5) {
    weaknesses.push("May feel nervous at high speeds");
  }

  if (scores.heatManagement <= 4) {
    weaknesses.push("Can run hot in slow traffic");
  }

  if (scores.suspensionCompliance <= 5) {
    weaknesses.push("Suspension may struggle on rough roads");
  }

  if (scores.ownershipPracticality <= 5) {
    weaknesses.push("Service network or parts availability may be limited");
  }

  return weaknesses.slice(0, 3); // Limit to top 3
}

/**
 * Generate trade-offs based on scores
 */
function identifyTradeoffs(scoredBike: ScoredMotorcycle): string[] {
  const tradeoffs: string[] = [];
  const scores = scoredBike.factorScores;

  // Fun vs Comfort tradeoff
  if (scores.funEngagement >= 7 && scores.riderComfort <= 6) {
    tradeoffs.push("Sporty character comes at the expense of long-ride comfort");
  }

  // City vs Highway tradeoff
  if (scores.dailyTrafficEase >= 7 && scores.highwayStability <= 6) {
    tradeoffs.push("Optimized for city use, highway stability is moderate");
  }

  if (scores.highwayStability >= 7 && scores.dailyTrafficEase <= 6) {
    tradeoffs.push("Built for highways, can feel heavy in city traffic");
  }

  // Weight tradeoffs
  const bike = scoredBike.motorcycle;
  if (bike.kerbWeight >= 180) {
    if (scores.highwayStability >= 7 && scores.primaryPillionComfort >= 7) {
      tradeoffs.push("Weight adds stability but affects nimbleness in traffic");
    }
  }

  if (bike.kerbWeight <= 155) {
    if (scores.dailyTrafficEase >= 7) {
      tradeoffs.push("Light weight is great for city, but may feel less planted on highways");
    }
  }

  // Power tradeoffs
  if (bike.power >= 35 && scores.heatManagement <= 5) {
    tradeoffs.push("High performance comes with increased heat in traffic");
  }

  return tradeoffs.slice(0, 3);
}

/**
 * Generate a local technical explanation (no AI)
 */
function generateLocalTechnicalExplanation(scoredBike: ScoredMotorcycle): string {
  const bike = scoredBike.motorcycle;
  const scores = scoredBike.factorScores;

  let explanation = `The ${bike.brand} ${bike.model} `;

  // Mention the overall score context
  if (scoredBike.finalScore >= 75) {
    explanation += "is an excellent all-rounder ";
  } else if (scoredBike.finalScore >= 60) {
    explanation += "offers a good balance ";
  } else {
    explanation += "may suit specific use cases ";
  }

  // Highlight top factors
  const topFactor = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];

  const factorMeta = FACTOR_METADATA.find(f => f.key === topFactor[0]);
  if (factorMeta) {
    explanation += `and particularly excels in ${factorMeta.label.toLowerCase()} (${topFactor[1]}/10). `;
  }

  // Add key spec context
  if (bike.absType === "dual-channel") {
    explanation += "Dual-channel ABS enhances safety confidence. ";
  }

  if (bike.engineCC >= 300 && bike.engineCC <= 500) {
    explanation += `The ${bike.engineCC}cc engine is well-suited for both city and highway use.`;
  }

  return explanation;
}

/**
 * Generate a parent-mode explanation (no AI)
 */
function generateLocalParentExplanation(scoredBike: ScoredMotorcycle): string {
  const bike = scoredBike.motorcycle;
  const scores = scoredBike.factorScores;

  let explanation = `The ${bike.brand} ${bike.model} `;

  // Safety first for parents
  if (scores.brakingSafetyConfidence >= 7) {
    explanation += "has good brakes and safety features. ";
  } else {
    explanation += "has basic safety equipment. ";
  }

  // Pillion consideration
  if (scores.primaryPillionComfort >= 7) {
    explanation += "It's comfortable for carrying a passenger. ";
  }

  // Practicality
  if (scores.ownershipPracticality >= 7) {
    explanation += "Service is widely available and parts are affordable. ";
  }

  // Long-term
  if (scores.longTermSuitability >= 7) {
    explanation += "This is a sensible choice for long-term ownership.";
  } else {
    explanation += "Consider your long-term needs carefully.";
  }

  return explanation;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Generate explanation for a scored motorcycle
 */
export async function explainMotorcycle(
  scoredBike: ScoredMotorcycle,
  totalBikes: number = 1
): Promise<BikeExplanation> {
  const bike = scoredBike.motorcycle;
  const bikeName = `${bike.brand} ${bike.model}`;

  // Identify strengths and weaknesses locally (always works)
  const strengths = identifyStrengths(scoredBike);
  const weaknesses = identifyWeaknesses(scoredBike);
  const localTradeoffs = identifyTradeoffs(scoredBike);

  // Try to get AI explanation if available
  if (isGeminiConfigured()) {
    try {
      const aiResult = await generateExplanation(
        bikeName,
        scoredBike.finalScore,
        scoredBike.factorScores as unknown as Record<string, number>,
        scoredBike.rank,
        totalBikes
      );

      return {
        technicalExplanation: aiResult.technicalExplanation,
        parentModeExplanation: aiResult.parentModeExplanation,
        tradeoffs: aiResult.tradeoffs.length > 0 ? aiResult.tradeoffs : localTradeoffs,
        strengths,
        weaknesses,
        confidence: aiResult.confidence,
      };
    } catch (error) {
      console.warn("AI explanation failed, using local fallback:", error);
    }
  }

  // Local fallback
  return {
    technicalExplanation: generateLocalTechnicalExplanation(scoredBike),
    parentModeExplanation: generateLocalParentExplanation(scoredBike),
    tradeoffs: localTradeoffs,
    strengths,
    weaknesses,
    confidence: "medium",
  };
}

/**
 * Generate comparison explanation
 */
export async function explainComparison(
  rankedBikes: ScoredMotorcycle[],
  weights: FactorWeights
): Promise<string> {
  if (rankedBikes.length < 2) {
    return "Add more bikes to see a comparison.";
  }

  const winner = rankedBikes[0];
  const runnerUp = rankedBikes[1];
  const comparison = compareScores(winner, runnerUp);

  // Get key differences (factors where winner is clearly better)
  const keyDifferences = comparison
    .filter((c) => c.winner === "bike1" && c.difference >= 1)
    .slice(0, 5)
    .map((c) => ({
      factor: c.label,
      winnerScore: c.bike1Score,
      loserScore: c.bike2Score,
    }));

  if (isGeminiConfigured()) {
    try {
      return await generateComparisonExplanation(
        {
          name: `${winner.motorcycle.brand} ${winner.motorcycle.model}`,
          score: winner.finalScore,
        },
        {
          name: `${runnerUp.motorcycle.brand} ${runnerUp.motorcycle.model}`,
          score: runnerUp.finalScore,
        },
        keyDifferences
      );
    } catch (error) {
      console.warn("AI comparison failed, using local fallback:", error);
    }
  }

  // Local fallback
  const winnerName = `${winner.motorcycle.brand} ${winner.motorcycle.model}`;
  const runnerUpName = `${runnerUp.motorcycle.brand} ${runnerUp.motorcycle.model}`;
  const scoreDiff = winner.finalScore - runnerUp.finalScore;

  if (keyDifferences.length > 0) {
    const topDiff = keyDifferences[0];
    return `${winnerName} ranked higher than ${runnerUpName} by ${scoreDiff} points, primarily due to better ${topDiff.factor.toLowerCase()} (${topDiff.winnerScore} vs ${topDiff.loserScore}).`;
  }

  return `${winnerName} scored ${winner.finalScore}/100, ${scoreDiff} points ahead of ${runnerUpName}.`;
}

/**
 * Generate full comparison result with explanations
 */
export async function generateComparisonResult(
  scoredBikes: ScoredMotorcycle[],
  weights: FactorWeights
): Promise<ComparisonResult> {
  // Generate individual explanations
  const explanations = await Promise.all(
    scoredBikes.map((bike) => explainMotorcycle(bike, scoredBikes.length))
  );

  // Generate comparison explanation
  const comparisonExplanation = await explainComparison(scoredBikes, weights);

  // Collect all trade-offs
  const allTradeoffs = explanations.flatMap((e) => e.tradeoffs);

  // Generate parent-mode summary
  const topBike = scoredBikes[0];
  const parentModeExplanation = explanations[0]?.parentModeExplanation ||
    `The ${topBike.motorcycle.brand} ${topBike.motorcycle.model} is our top recommendation based on your priorities.`;

  return {
    motorcycles: scoredBikes,
    explanation: comparisonExplanation,
    parentModeExplanation,
    tradeoffs: [...new Set(allTradeoffs)], // Deduplicate
    generatedAt: new Date(),
  };
}
