/**
 * Motologix - Validator (Sanity Check Agent)
 *
 * Validates motorcycles, weights, and comparison results.
 * Prevents unsafe, unrealistic, or contradictory outputs.
 */

import type {
  Motorcycle,
  FactorWeights,
  ScoredMotorcycle,
  FactorScores,
} from "@/types";
import { DEFAULT_WEIGHTS } from "@/types";

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

// ============================================
// MOTORCYCLE VALIDATION
// ============================================

/**
 * Validate motorcycle data completeness and sanity
 */
export function validateMotorcycle(bike: Partial<Motorcycle>): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  // Required fields
  if (!bike.brand) {
    errors.push({ code: "MISSING_BRAND", message: "Brand is required", field: "brand" });
  }
  if (!bike.model) {
    errors.push({ code: "MISSING_MODEL", message: "Model is required", field: "model" });
  }

  // Core specs validation
  if (!bike.engineCC || bike.engineCC <= 0) {
    errors.push({ code: "INVALID_ENGINE", message: "Valid engine CC is required", field: "engineCC" });
  } else if (bike.engineCC > 2000) {
    warnings.push({ code: "LARGE_ENGINE", message: "Engine CC seems unusually large", field: "engineCC" });
  }

  if (!bike.power || bike.power <= 0) {
    errors.push({ code: "INVALID_POWER", message: "Valid power (bhp) is required", field: "power" });
  } else if (bike.power > 200) {
    warnings.push({ code: "HIGH_POWER", message: "Power output seems unusually high", field: "power" });
  }

  if (!bike.torque || bike.torque <= 0) {
    warnings.push({ code: "MISSING_TORQUE", message: "Torque data is missing", field: "torque" });
  }

  if (!bike.kerbWeight || bike.kerbWeight <= 0) {
    errors.push({ code: "INVALID_WEIGHT", message: "Valid kerb weight is required", field: "kerbWeight" });
  } else if (bike.kerbWeight < 80 || bike.kerbWeight > 400) {
    warnings.push({ code: "UNUSUAL_WEIGHT", message: "Kerb weight seems unusual", field: "kerbWeight" });
  }

  // Dimensions validation
  if (!bike.seatHeight || bike.seatHeight <= 0) {
    warnings.push({ code: "MISSING_SEAT_HEIGHT", message: "Seat height is missing", field: "seatHeight" });
  } else if (bike.seatHeight < 600 || bike.seatHeight > 1000) {
    warnings.push({ code: "UNUSUAL_SEAT_HEIGHT", message: "Seat height seems unusual", field: "seatHeight" });
  }

  if (!bike.wheelbase || bike.wheelbase <= 0) {
    warnings.push({ code: "MISSING_WHEELBASE", message: "Wheelbase is missing", field: "wheelbase" });
  }

  if (!bike.groundClearance || bike.groundClearance <= 0) {
    warnings.push({ code: "MISSING_GROUND_CLEARANCE", message: "Ground clearance is missing", field: "groundClearance" });
  }

  // Braking validation
  if (!bike.frontBrake) {
    errors.push({ code: "MISSING_FRONT_BRAKE", message: "Front brake type is required", field: "frontBrake" });
  }
  if (!bike.rearBrake) {
    errors.push({ code: "MISSING_REAR_BRAKE", message: "Rear brake type is required", field: "rearBrake" });
  }
  if (!bike.absType) {
    warnings.push({ code: "MISSING_ABS", message: "ABS type is not specified", field: "absType" });
  }

  // Tyre validation
  if (!bike.frontTyreWidth || bike.frontTyreWidth <= 0) {
    warnings.push({ code: "MISSING_FRONT_TYRE", message: "Front tyre width is missing", field: "frontTyreWidth" });
  }
  if (!bike.rearTyreWidth || bike.rearTyreWidth <= 0) {
    warnings.push({ code: "MISSING_REAR_TYRE", message: "Rear tyre width is missing", field: "rearTyreWidth" });
  }

  // Suspension validation
  if (!bike.frontSuspension) {
    warnings.push({ code: "MISSING_FRONT_SUSPENSION", message: "Front suspension type is missing", field: "frontSuspension" });
  }
  if (!bike.rearSuspension) {
    warnings.push({ code: "MISSING_REAR_SUSPENSION", message: "Rear suspension type is missing", field: "rearSuspension" });
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Check if motorcycle has minimum required data for scoring
 */
export function hasMinimumData(bike: Partial<Motorcycle>): boolean {
  return !!(
    bike.brand &&
    bike.model &&
    bike.engineCC &&
    bike.power &&
    bike.kerbWeight &&
    bike.frontBrake &&
    bike.rearBrake
  );
}

// ============================================
// WEIGHTS VALIDATION
// ============================================

/**
 * Validate factor weights
 */
export function validateWeights(weights: FactorWeights): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);

  // Check sum is approximately 1.0
  if (Math.abs(total - 1.0) > 0.05) {
    errors.push({
      code: "INVALID_WEIGHT_SUM",
      message: `Weights should sum to 1.0, got ${total.toFixed(3)}`,
    });
  } else if (Math.abs(total - 1.0) > 0.01) {
    warnings.push({
      code: "WEIGHT_SUM_INEXACT",
      message: `Weights sum to ${total.toFixed(3)}, will be normalized`,
    });
  }

  // Check individual weights are valid
  for (const [key, value] of Object.entries(weights)) {
    if (value < 0) {
      errors.push({
        code: "NEGATIVE_WEIGHT",
        message: `Weight for ${key} cannot be negative`,
        field: key,
      });
    }
    if (value > 0.5) {
      warnings.push({
        code: "HIGH_WEIGHT",
        message: `Weight for ${key} is unusually high (${(value * 100).toFixed(0)}%)`,
        field: key,
      });
    }
  }

  // Check for zero weights
  const zeroWeights = Object.entries(weights)
    .filter(([, v]) => v === 0)
    .map(([k]) => k);

  if (zeroWeights.length > 3) {
    warnings.push({
      code: "MANY_ZERO_WEIGHTS",
      message: `${zeroWeights.length} factors have zero weight, consider using defaults`,
    });
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

// ============================================
// SCORE VALIDATION
// ============================================

/**
 * Validate factor scores are within bounds
 */
export function validateFactorScores(scores: FactorScores): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  for (const [key, value] of Object.entries(scores)) {
    if (value < 1 || value > 10) {
      errors.push({
        code: "SCORE_OUT_OF_BOUNDS",
        message: `Score for ${key} must be between 1 and 10, got ${value}`,
        field: key,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate scored motorcycle result
 */
export function validateScoredMotorcycle(scored: ScoredMotorcycle): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  // Validate final score
  if (scored.finalScore < 0 || scored.finalScore > 100) {
    errors.push({
      code: "FINAL_SCORE_OUT_OF_BOUNDS",
      message: `Final score must be between 0 and 100, got ${scored.finalScore}`,
    });
  }

  // Validate factor scores
  const factorValidation = validateFactorScores(scored.factorScores);
  errors.push(...factorValidation.errors);
  warnings.push(...factorValidation.warnings);

  // Check for low confidence scores
  const lowConfidenceFactors = Object.entries(scored.confidences)
    .filter(([, conf]) => conf === "low")
    .map(([key]) => key);

  if (lowConfidenceFactors.length >= 3) {
    warnings.push({
      code: "LOW_CONFIDENCE",
      message: `${lowConfidenceFactors.length} factors have low confidence`,
    });
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

// ============================================
// COMPARISON VALIDATION
// ============================================

/**
 * Validate a comparison result
 */
export function validateComparison(
  scoredBikes: ScoredMotorcycle[]
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  if (scoredBikes.length === 0) {
    errors.push({
      code: "NO_BIKES",
      message: "At least one motorcycle is required for comparison",
    });
    return { isValid: false, warnings, errors };
  }

  // Validate each bike
  for (const bike of scoredBikes) {
    const bikeValidation = validateScoredMotorcycle(bike);
    for (const error of bikeValidation.errors) {
      errors.push({
        ...error,
        message: `${bike.motorcycle.brand} ${bike.motorcycle.model}: ${error.message}`,
      });
    }
    for (const warning of bikeValidation.warnings) {
      warnings.push({
        ...warning,
        message: `${bike.motorcycle.brand} ${bike.motorcycle.model}: ${warning.message}`,
      });
    }
  }

  // Check for score clustering (all bikes very similar)
  if (scoredBikes.length >= 2) {
    const scores = scoredBikes.map((b) => b.finalScore);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const range = maxScore - minScore;

    if (range < 5) {
      warnings.push({
        code: "NARROW_SCORE_RANGE",
        message: `All bikes scored within ${range} points - consider adjusting weights for differentiation`,
      });
    }
  }

  // Check rankings are valid
  const ranks = scoredBikes.map((b) => b.rank);
  if (!ranks.includes(1)) {
    errors.push({
      code: "INVALID_RANKING",
      message: "No bike has rank 1",
    });
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get default weights if validation fails
 */
export function getValidWeightsOrDefault(weights: FactorWeights): FactorWeights {
  const validation = validateWeights(weights);
  return validation.isValid ? weights : { ...DEFAULT_WEIGHTS };
}

/**
 * Fill missing motorcycle data with sensible defaults
 */
export function fillMissingData(bike: Partial<Motorcycle>): Motorcycle {
  return {
    id: bike.id || crypto.randomUUID(),
    brand: bike.brand || "Unknown",
    model: bike.model || "Unknown",
    variant: bike.variant,
    year: bike.year,
    engineCC: bike.engineCC || 150,
    power: bike.power || 10,
    torque: bike.torque || 10,
    kerbWeight: bike.kerbWeight || 140,
    seatHeight: bike.seatHeight || 780,
    wheelbase: bike.wheelbase || 1350,
    groundClearance: bike.groundClearance || 160,
    fuelCapacity: bike.fuelCapacity || 12,
    frontBrake: bike.frontBrake || "disc",
    rearBrake: bike.rearBrake || "drum",
    absType: bike.absType || "none",
    frontTyreWidth: bike.frontTyreWidth || 100,
    rearTyreWidth: bike.rearTyreWidth || 130,
    frontSuspension: bike.frontSuspension || "telescopic",
    rearSuspension: bike.rearSuspension || "twin",
    rearSuspensionTravel: bike.rearSuspensionTravel,
    handlebarType: bike.handlebarType,
    exShowroomPrice: bike.exShowroomPrice,
    reviewSummary: bike.reviewSummary,
    heatManagementRating: bike.heatManagementRating,
    confidence: bike.confidence || "low",
    searchQuery: bike.searchQuery || "",
  };
}
