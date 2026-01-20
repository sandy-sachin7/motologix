/**
 * Motologix - Normalization Engine
 *
 * Converts raw motorcycle specifications into human-relevant factor scores (1-10).
 * All rules are deterministic and auditable.
 */

import type {
  Motorcycle,
  FactorScores,
  FactorKey,
  PillionMode,
} from "@/types";

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round to nearest 0.5
 */
function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

// ============================================
// INDIVIDUAL FACTOR SCORING FUNCTIONS
// ============================================

/**
 * Daily Traffic Ease
 * Factors: weight, seat height, power-to-weight ratio
 * Lighter, lower, and moderate power = better in traffic
 */
export function scoreDailyTrafficEase(bike: Motorcycle): number {
  let score = 5; // baseline

  // Weight factor (lighter = better in traffic)
  if (bike.kerbWeight < 140) score += 2;
  else if (bike.kerbWeight < 160) score += 1.5;
  else if (bike.kerbWeight < 175) score += 0.5;
  else if (bike.kerbWeight > 200) score -= 1.5;
  else if (bike.kerbWeight > 185) score -= 0.5;

  // Seat height (lower = easier flat-footing at stops)
  if (bike.seatHeight < 770) score += 1;
  else if (bike.seatHeight < 790) score += 0.5;
  else if (bike.seatHeight > 830) score -= 1;
  else if (bike.seatHeight > 810) score -= 0.5;

  // Power-to-weight (sweet spot for traffic: 6-10 bhp per 100kg)
  const pwr = (bike.power / bike.kerbWeight) * 100;
  if (pwr >= 6 && pwr <= 10) score += 1; // sweet spot for city
  else if (pwr > 12) score -= 0.5; // too aggressive for traffic

  // Engine size (smaller engines = easier low-speed maneuvers)
  if (bike.engineCC < 250) score += 0.5;
  else if (bike.engineCC > 500) score -= 0.5;

  return clamp(roundHalf(score), 1, 10);
}

/**
 * Braking & Safety Confidence
 * Factors: brake hardware, ABS type, tyre width
 */
export function scoreBrakingSafetyConfidence(bike: Motorcycle): number {
  let score = 3; // baseline (drum brakes, no ABS)

  // Front brake hardware
  if (bike.frontBrake === "disc") score += 2;

  // Rear brake hardware
  if (bike.rearBrake === "disc") score += 1;

  // ABS system (critical for safety)
  if (bike.absType === "dual-channel") score += 3;
  else if (bike.absType === "single-channel") score += 1.5;

  // Tyre width (wider = more grip)
  if (bike.rearTyreWidth >= 150) score += 0.5;
  else if (bike.rearTyreWidth >= 140) score += 0.25;

  if (bike.frontTyreWidth >= 120) score += 0.5;
  else if (bike.frontTyreWidth >= 110) score += 0.25;

  return clamp(roundHalf(score), 1, 10);
}

/**
 * Pillion Comfort
 * Factors: rear suspension, weight, wheelbase, seat height
 */
export function scorePrimaryPillionComfort(
  bike: Motorcycle,
  pillionMode: PillionMode = "primary"
): number {
  let score = 5; // baseline

  // Rear suspension type
  if (bike.rearSuspension === "monoshock") score += 1;

  // Rear suspension travel (if available)
  if (bike.rearSuspensionTravel && bike.rearSuspensionTravel >= 130) score += 1;
  else if (bike.rearSuspensionTravel && bike.rearSuspensionTravel >= 110)
    score += 0.5;

  // Weight (heavier = more stable for pillion)
  if (bike.kerbWeight >= 180) score += 1;
  else if (bike.kerbWeight >= 165) score += 0.5;
  else if (bike.kerbWeight < 140) score -= 0.5;

  // Wheelbase (longer = more stable)
  if (bike.wheelbase >= 1420) score += 1;
  else if (bike.wheelbase >= 1380) score += 0.5;
  else if (bike.wheelbase < 1320) score -= 0.5;

  // Seat height (lower is generally more confidence-inspiring)
  if (bike.seatHeight < 790) score += 0.5;
  else if (bike.seatHeight > 830) score -= 0.5;

  // Secondary pillion (parents) - prioritize stability even more
  if (pillionMode === "secondary") {
    if (bike.kerbWeight >= 175) score += 0.5;
    if (bike.rearSuspension === "monoshock") score += 0.5;
    // ABS is critical for pillion safety perception
    if (bike.absType === "dual-channel") score += 0.5;
  }

  return clamp(roundHalf(score), 1, 10);
}

/**
 * Highway Stability
 * Factors: wheelbase, weight, power, tyre width
 */
export function scoreHighwayStability(bike: Motorcycle): number {
  let score = 5; // baseline

  // Wheelbase (longer = more stable at speed)
  if (bike.wheelbase >= 1430) score += 1.5;
  else if (bike.wheelbase >= 1400) score += 1;
  else if (bike.wheelbase >= 1370) score += 0.5;
  else if (bike.wheelbase < 1320) score -= 1;

  // Weight (heavier = more planted at speed)
  if (bike.kerbWeight >= 180) score += 1;
  else if (bike.kerbWeight >= 165) score += 0.5;
  else if (bike.kerbWeight < 145) score -= 0.5;

  // Power (enough for confident overtakes)
  if (bike.power >= 35) score += 1;
  else if (bike.power >= 25) score += 0.5;
  else if (bike.power < 18) score -= 0.5;

  // Rear tyre width
  if (bike.rearTyreWidth >= 150) score += 0.5;
  else if (bike.rearTyreWidth >= 140) score += 0.25;

  return clamp(roundHalf(score), 1, 10);
}

/**
 * Rider Comfort (Long Rides)
 * Factors: handlebar position, seat, suspension, fuel capacity
 */
export function scoreRiderComfort(bike: Motorcycle): number {
  let score = 5; // baseline

  // Handlebar type (upright = more comfortable)
  if (bike.handlebarType === "raised") score += 1;
  else if (bike.handlebarType === "standard") score += 0.5;
  else if (bike.handlebarType === "clip-on") score -= 1;

  // Seat height comfort zone (neither too high nor too low)
  if (bike.seatHeight >= 780 && bike.seatHeight <= 820) score += 0.5;
  else if (bike.seatHeight > 840) score -= 0.5;

  // Fuel capacity (longer range = fewer stops)
  if (bike.fuelCapacity >= 15) score += 1;
  else if (bike.fuelCapacity >= 12) score += 0.5;
  else if (bike.fuelCapacity < 10) score -= 0.5;

  // Suspension quality indicator
  if (bike.rearSuspension === "monoshock") score += 0.5;

  // Ground clearance for Indian roads
  if (bike.groundClearance >= 180) score += 0.5;
  else if (bike.groundClearance >= 160) score += 0.25;
  else if (bike.groundClearance < 140) score -= 0.5;

  return clamp(roundHalf(score), 1, 10);
}

/**
 * Suspension Compliance (Indian Roads)
 * Factors: suspension type, travel, ground clearance
 */
export function scoreSuspensionCompliance(bike: Motorcycle): number {
  let score = 5; // baseline

  // Rear suspension type
  if (bike.rearSuspension === "monoshock") score += 1.5;
  else if (bike.rearSuspension === "twin") score += 0.5;

  // Suspension travel
  if (bike.rearSuspensionTravel && bike.rearSuspensionTravel >= 140) score += 1;
  else if (bike.rearSuspensionTravel && bike.rearSuspensionTravel >= 120)
    score += 0.5;
  else if (bike.rearSuspensionTravel && bike.rearSuspensionTravel < 100)
    score -= 0.5;

  // Front suspension (USD forks are generally better)
  if (bike.frontSuspension.toLowerCase().includes("usd")) score += 1;
  else if (bike.frontSuspension.toLowerCase().includes("telescopic"))
    score += 0.25;

  // Ground clearance (critical for Indian roads)
  if (bike.groundClearance >= 200) score += 1;
  else if (bike.groundClearance >= 175) score += 0.5;
  else if (bike.groundClearance >= 160) score += 0.25;
  else if (bike.groundClearance < 140) score -= 1;

  return clamp(roundHalf(score), 1, 10);
}

/**
 * Fun & Engagement
 * Factors: power-to-weight, engine character, handling dynamics
 */
export function scoreFunEngagement(bike: Motorcycle): number {
  let score = 5; // baseline

  // Power-to-weight ratio (higher = more fun)
  const pwr = (bike.power / bike.kerbWeight) * 100;
  if (pwr >= 12) score += 2;
  else if (pwr >= 10) score += 1.5;
  else if (pwr >= 8) score += 1;
  else if (pwr >= 6) score += 0.5;
  else if (pwr < 5) score -= 0.5;

  // Engine size (larger tends to be more engaging)
  if (bike.engineCC >= 400) score += 1;
  else if (bike.engineCC >= 300) score += 0.5;
  else if (bike.engineCC < 200) score -= 0.5;

  // Weight (lighter = more flickable)
  if (bike.kerbWeight < 160) score += 0.5;
  else if (bike.kerbWeight > 200) score -= 0.5;

  // Handlebar (sportier = more engaging)
  if (bike.handlebarType === "clip-on") score += 0.5;

  return clamp(roundHalf(score), 1, 10);
}

/**
 * Heat Management
 * Factors: engine size, expected cooling, AI-derived rating if available
 */
export function scoreHeatManagement(bike: Motorcycle): number {
  // If AI provided a heat rating, use it with some validation
  if (bike.heatManagementRating && bike.heatManagementRating >= 1 && bike.heatManagementRating <= 10) {
    return roundHalf(bike.heatManagementRating);
  }

  let score = 6; // baseline (assume decent heat management)

  // Larger engines tend to run hotter
  if (bike.engineCC >= 400) score -= 1;
  else if (bike.engineCC >= 300) score -= 0.5;
  else if (bike.engineCC < 200) score += 0.5;

  // Power output affects heat
  if (bike.power >= 40) score -= 0.5;
  else if (bike.power < 20) score += 0.5;

  return clamp(roundHalf(score), 1, 10);
}

/**
 * Ownership Practicality
 * Factors: brand reliability reputation, price segment, estimated service costs
 * Note: This relies heavily on brand/model context which AI might provide
 */
export function scoreOwnershipPracticality(bike: Motorcycle): number {
  let score = 5; // baseline

  // Brand-based adjustments (common Indian market perception)
  const brand = bike.brand.toLowerCase();

  // High service network availability
  if (
    brand.includes("hero") ||
    brand.includes("honda") ||
    brand.includes("tvs") ||
    brand.includes("bajaj")
  ) {
    score += 1.5;
  }
  // Good service network
  else if (brand.includes("royal enfield") || brand.includes("suzuki")) {
    score += 1;
  }
  // Moderate service network
  else if (brand.includes("yamaha") || brand.includes("ktm")) {
    score += 0.5;
  }
  // Limited service network
  else if (
    brand.includes("kawasaki") ||
    brand.includes("benelli") ||
    brand.includes("triumph")
  ) {
    score -= 0.5;
  }

  // Price segment affects parts cost
  if (bike.exShowroomPrice) {
    if (bike.exShowroomPrice < 150000) score += 0.5;
    else if (bike.exShowroomPrice > 300000) score -= 0.5;
    else if (bike.exShowroomPrice > 500000) score -= 1;
  }

  return clamp(roundHalf(score), 1, 10);
}

/**
 * Long-Term Suitability (9+ years)
 * Factors: build quality indicators, engine character, versatility
 */
export function scoreLongTermSuitability(bike: Motorcycle): number {
  let score = 5; // baseline

  // Engine size (sweet spot for long-term: 250-500cc)
  if (bike.engineCC >= 250 && bike.engineCC <= 500) score += 1;
  else if (bike.engineCC >= 200 && bike.engineCC <= 600) score += 0.5;
  else if (bike.engineCC < 150) score -= 0.5;
  else if (bike.engineCC > 700) score -= 0.5; // too much for some uses

  // Power level (moderate is sustainable)
  if (bike.power >= 20 && bike.power <= 45) score += 0.5;

  // Brand durability reputation
  const brand = bike.brand.toLowerCase();
  if (brand.includes("honda") || brand.includes("royal enfield")) {
    score += 1;
  } else if (brand.includes("hero") || brand.includes("tvs")) {
    score += 0.5;
  }

  // ABS for future-proofing
  if (bike.absType === "dual-channel") score += 0.5;

  // Fuel capacity for practicality
  if (bike.fuelCapacity >= 14) score += 0.5;

  // Versatility (good ground clearance, reasonable weight)
  if (bike.groundClearance >= 170 && bike.kerbWeight <= 185) score += 0.5;

  return clamp(roundHalf(score), 1, 10);
}

// ============================================
// MAIN NORMALIZATION FUNCTION
// ============================================

/**
 * Calculate all factor scores for a motorcycle
 */
export function normalizeMotorcycle(
  bike: Motorcycle,
  pillionMode: PillionMode = "primary"
): FactorScores {
  return {
    dailyTrafficEase: scoreDailyTrafficEase(bike),
    brakingSafetyConfidence: scoreBrakingSafetyConfidence(bike),
    primaryPillionComfort: scorePrimaryPillionComfort(bike, pillionMode),
    highwayStability: scoreHighwayStability(bike),
    riderComfort: scoreRiderComfort(bike),
    suspensionCompliance: scoreSuspensionCompliance(bike),
    funEngagement: scoreFunEngagement(bike),
    heatManagement: scoreHeatManagement(bike),
    ownershipPracticality: scoreOwnershipPracticality(bike),
    longTermSuitability: scoreLongTermSuitability(bike),
  };
}

/**
 * Get confidence levels for each factor
 * Based on data completeness and source
 */
export function getFactorConfidences(
  bike: Motorcycle
): Record<FactorKey, "high" | "medium" | "low"> {
  const baseConfidence = bike.confidence;

  // Start with base confidence for all factors
  const confidences: Record<FactorKey, "high" | "medium" | "low"> = {
    dailyTrafficEase: baseConfidence,
    brakingSafetyConfidence: baseConfidence,
    primaryPillionComfort: baseConfidence,
    highwayStability: baseConfidence,
    riderComfort: baseConfidence,
    suspensionCompliance: baseConfidence,
    funEngagement: baseConfidence,
    heatManagement: bike.heatManagementRating ? baseConfidence : "low", // AI-derived
    ownershipPracticality: "medium", // Always somewhat subjective
    longTermSuitability: "medium", // Involves prediction
  };

  // Adjust based on missing data
  if (!bike.rearSuspensionTravel) {
    confidences.suspensionCompliance =
      confidences.suspensionCompliance === "high" ? "medium" : "low";
    confidences.primaryPillionComfort =
      confidences.primaryPillionComfort === "high" ? "medium" : "low";
  }

  if (!bike.handlebarType) {
    confidences.riderComfort =
      confidences.riderComfort === "high" ? "medium" : "low";
    confidences.funEngagement =
      confidences.funEngagement === "high" ? "medium" : "low";
  }

  return confidences;
}
