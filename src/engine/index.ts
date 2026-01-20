/**
 * Motologix - Engine Exports
 *
 * Central export point for all engine functionality.
 */

// Normalization (spec → factor scores)
export {
  normalizeMotorcycle,
  getFactorConfidences,
  scoreDailyTrafficEase,
  scoreBrakingSafetyConfidence,
  scorePrimaryPillionComfort,
  scoreHighwayStability,
  scoreRiderComfort,
  scoreSuspensionCompliance,
  scoreFunEngagement,
  scoreHeatManagement,
  scoreOwnershipPracticality,
  scoreLongTermSuitability,
} from "./normalizer";

// Scoring (factor scores + weights → final score)
export {
  calculateFinalScore,
  validateWeights,
  normalizeWeights,
  scoreMotorcycle,
  scoreAndRankMotorcycles,
  getScoreBreakdown,
  compareScores,
} from "./scoring";

// Validation (sanity checks)
export {
  validateMotorcycle,
  hasMinimumData,
  validateWeights as validateWeightsDetailed,
  validateFactorScores,
  validateScoredMotorcycle,
  validateComparison,
  getValidWeightsOrDefault,
  fillMissingData,
} from "./validator";

export type { ValidationResult, ValidationWarning, ValidationError } from "./validator";
