/**
 * Motologix - Bike Discovery Agent
 *
 * Discovers motorcycles using Gemini API with search grounding.
 * Converts AI-discovered data into normalized Motorcycle objects.
 */

import type { Motorcycle } from "@/types";
import {
  discoverBike,
  discoverBikes,
  isGeminiConfigured,
  type BikeDiscoveryResult,
} from "@/lib/gemini";
import { validateMotorcycle, fillMissingData } from "@/engine/validator";

// ============================================
// TYPES
// ============================================

export interface DiscoveryResult {
  success: boolean;
  motorcycle?: Motorcycle;
  error?: string;
  warnings: string[];
  query: string;
}

export interface BatchDiscoveryResult {
  results: DiscoveryResult[];
  successful: number;
  failed: number;
  totalTime: number;
}

// ============================================
// CONVERSION
// ============================================

/**
 * Convert Gemini discovery result to Motorcycle type
 */
function convertToMotorcycle(
  result: BikeDiscoveryResult,
  query: string
): Motorcycle {
  return {
    id: crypto.randomUUID(),
    brand: result.brand,
    model: result.model,
    variant: result.variant,
    year: result.year,
    engineCC: result.engineCC,
    power: result.power,
    torque: result.torque,
    kerbWeight: result.kerbWeight,
    seatHeight: result.seatHeight,
    wheelbase: result.wheelbase,
    groundClearance: result.groundClearance,
    fuelCapacity: result.fuelCapacity,
    frontBrake: result.frontBrake,
    rearBrake: result.rearBrake,
    absType: result.absType,
    frontTyreWidth: result.frontTyreWidth,
    rearTyreWidth: result.rearTyreWidth,
    frontSuspension: result.frontSuspension,
    rearSuspension: result.rearSuspension,
    rearSuspensionTravel: result.rearSuspensionTravel,
    handlebarType: result.handlebarType,
    exShowroomPrice: result.exShowroomPrice,
    confidence: result.confidence,
    searchQuery: query,
  };
}

// ============================================
// DISCOVERY FUNCTIONS
// ============================================

/**
 * Discover a single motorcycle by name/query
 */
export async function discoverMotorcycle(query: string): Promise<DiscoveryResult> {
  const warnings: string[] = [];

  // Check if Gemini is configured
  if (!isGeminiConfigured()) {
    return {
      success: false,
      error: "Gemini API is not configured. Please add GEMINI_API_KEY to .env.local",
      warnings: [],
      query,
    };
  }

  try {
    // Call Gemini API
    const result = await discoverBike(query);

    // Convert to Motorcycle type
    const motorcycle = convertToMotorcycle(result, query);

    // Validate the result
    const validation = validateMotorcycle(motorcycle);

    if (!validation.isValid) {
      // Try to fill missing data and validate again
      const filledMotorcycle = fillMissingData(motorcycle);
      const revalidation = validateMotorcycle(filledMotorcycle);

      if (!revalidation.isValid) {
        return {
          success: false,
          error: validation.errors.map((e) => e.message).join("; "),
          warnings: validation.warnings.map((w) => w.message),
          query,
        };
      }

      // Return filled motorcycle with warnings
      warnings.push(...validation.warnings.map((w) => w.message));
      warnings.push("Some data was auto-filled due to missing values");

      return {
        success: true,
        motorcycle: filledMotorcycle,
        warnings,
        query,
      };
    }

    // Add any validation warnings
    warnings.push(...validation.warnings.map((w) => w.message));

    // Add confidence warning if low
    if (motorcycle.confidence === "low") {
      warnings.push("Data confidence is low - verify specifications manually");
    }

    return {
      success: true,
      motorcycle,
      warnings,
      query,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during discovery",
      warnings: [],
      query,
    };
  }
}

/**
 * Discover multiple motorcycles in parallel
 */
export async function discoverMotorcycles(
  queries: string[]
): Promise<BatchDiscoveryResult> {
  const startTime = Date.now();

  // Check if Gemini is configured
  if (!isGeminiConfigured()) {
    return {
      results: queries.map((query) => ({
        success: false,
        error: "Gemini API is not configured",
        warnings: [],
        query,
      })),
      successful: 0,
      failed: queries.length,
      totalTime: 0,
    };
  }

  // Discover all bikes in parallel
  const geminiResults = await discoverBikes(queries);

  // Process results
  const results: DiscoveryResult[] = [];

  for (const [query, result] of geminiResults) {
    if (result instanceof Error) {
      results.push({
        success: false,
        error: result.message,
        warnings: [],
        query,
      });
    } else {
      const motorcycle = convertToMotorcycle(result, query);
      const validation = validateMotorcycle(motorcycle);

      if (!validation.isValid) {
        // Try to fill missing data
        const filledMotorcycle = fillMissingData(motorcycle);
        results.push({
          success: true,
          motorcycle: filledMotorcycle,
          warnings: [
            ...validation.warnings.map((w) => w.message),
            "Some data was auto-filled",
          ],
          query,
        });
      } else {
        results.push({
          success: true,
          motorcycle,
          warnings: validation.warnings.map((w) => w.message),
          query,
        });
      }
    }
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    results,
    successful,
    failed,
    totalTime: Date.now() - startTime,
  };
}

// ============================================
// MOCK DATA (for development without API key)
// ============================================

const MOCK_BIKES: Record<string, Partial<Motorcycle>> = {
  "ktm duke 390": {
    brand: "KTM",
    model: "390 Duke",
    variant: "Standard",
    year: 2025,
    engineCC: 399, // Updated for 2025 Gen 3
    power: 46,     // Updated for 2025 Gen 3
    torque: 39,    // Updated for 2025 Gen 3
    kerbWeight: 168,
    seatHeight: 820, // Updated
    wheelbase: 1357,
    groundClearance: 183,
    fuelCapacity: 15, // Updated
    frontBrake: "disc",
    rearBrake: "disc",
    absType: "cornering-abs",
    frontTyreWidth: 110,
    rearTyreWidth: 150,
    frontSuspension: "WP APEX USD 43mm Adjustable",
    rearSuspension: "WP APEX Monoshock Adjustable",
    rearSuspensionTravel: 150,
    handlebarType: "standard",
    exShowroomPrice: 330000,
    confidence: "high",
  },
  "duke 390": { // Alias
    brand: "KTM",
    model: "390 Duke",
    variant: "Standard",
    year: 2025,
    engineCC: 399,
    power: 46,
    torque: 39,
    kerbWeight: 168,
    seatHeight: 820,
    wheelbase: 1357,
    groundClearance: 183,
    fuelCapacity: 15,
    frontBrake: "disc",
    rearBrake: "disc",
    absType: "cornering-abs",
    frontTyreWidth: 110,
    rearTyreWidth: 150,
    frontSuspension: "WP APEX USD 43mm Adjustable",
    rearSuspension: "WP APEX Monoshock Adjustable",
    rearSuspensionTravel: 150,
    handlebarType: "standard",
    exShowroomPrice: 330000,
    confidence: "high",
  },
  "royal enfield himalayan": {
    brand: "Royal Enfield",
    model: "Himalayan 450",
    variant: "Base",
    year: 2025,
    engineCC: 452,
    power: 40,
    torque: 40,
    kerbWeight: 196,
    seatHeight: 825,
    wheelbase: 1465,
    groundClearance: 230,
    fuelCapacity: 17,
    frontBrake: "disc",
    rearBrake: "disc",
    absType: "switchable-abs",
    frontTyreWidth: 90,
    rearTyreWidth: 140,
    frontSuspension: "Showa USD 43mm",
    rearSuspension: "monoshock",
    rearSuspensionTravel: 200,
    handlebarType: "raised",
    exShowroomPrice: 298000,
    confidence: "high",
  },
  "himalayan 450": { // Alias
    brand: "Royal Enfield",
    model: "Himalayan 450",
    variant: "Base",
    year: 2025,
    engineCC: 452,
    power: 40,
    torque: 40,
    kerbWeight: 196,
    seatHeight: 825,
    wheelbase: 1465,
    groundClearance: 230,
    fuelCapacity: 17,
    frontBrake: "disc",
    rearBrake: "disc",
    absType: "switchable-abs",
    frontTyreWidth: 90,
    rearTyreWidth: 140,
    frontSuspension: "Showa USD 43mm",
    rearSuspension: "monoshock",
    rearSuspensionTravel: 200,
    handlebarType: "raised",
    exShowroomPrice: 298000,
    confidence: "high",
  },
  "bajaj pulsar ns200": {
    brand: "Bajaj",
    model: "Pulsar NS200",
    variant: "ABS",
    year: 2025,
    engineCC: 199,
    power: 24.5,
    torque: 18.7,
    kerbWeight: 158,
    seatHeight: 805,
    wheelbase: 1363,
    groundClearance: 168,
    fuelCapacity: 12,
    frontBrake: "disc",
    rearBrake: "disc",
    absType: "dual-channel",
    frontTyreWidth: 100,
    rearTyreWidth: 130,
    frontSuspension: "USD Forks",
    rearSuspension: "monoshock",
    rearSuspensionTravel: 120,
    handlebarType: "clip-on",
    exShowroomPrice: 158000,
    confidence: "high",
  },
  "ns200": { // Alias
    brand: "Bajaj",
    model: "Pulsar NS200",
    variant: "ABS",
    year: 2025,
    engineCC: 199,
    power: 24.5,
    torque: 18.7,
    kerbWeight: 158,
    seatHeight: 805,
    wheelbase: 1363,
    groundClearance: 168,
    fuelCapacity: 12,
    frontBrake: "disc",
    rearBrake: "disc",
    absType: "dual-channel",
    frontTyreWidth: 100,
    rearTyreWidth: 130,
    frontSuspension: "USD Forks",
    rearSuspension: "monoshock",
    rearSuspensionTravel: 120,
    handlebarType: "clip-on",
    exShowroomPrice: 158000,
    confidence: "high",
  },
  "honda cb350": {
    brand: "Honda",
    model: "CB350",
    variant: "DLX Pro",
    year: 2025,
    engineCC: 348,
    power: 21,
    torque: 30,
    kerbWeight: 181,
    seatHeight: 800,
    wheelbase: 1441,
    groundClearance: 166,
    fuelCapacity: 15,
    frontBrake: "disc",
    rearBrake: "disc",
    absType: "dual-channel",
    frontTyreWidth: 100,
    rearTyreWidth: 130,
    frontSuspension: "Telescopic",
    rearSuspension: "twin",
    rearSuspensionTravel: 105,
    handlebarType: "raised",
    exShowroomPrice: 220000,
    confidence: "high",
  },
  "cb350": { // Alias
    brand: "Honda",
    model: "CB350",
    variant: "DLX Pro",
    year: 2025,
    engineCC: 348,
    power: 21,
    torque: 30,
    kerbWeight: 181,
    seatHeight: 800,
    wheelbase: 1441,
    groundClearance: 166,
    fuelCapacity: 15,
    frontBrake: "disc",
    rearBrake: "disc",
    absType: "dual-channel",
    frontTyreWidth: 100,
    rearTyreWidth: 130,
    frontSuspension: "Telescopic",
    rearSuspension: "twin",
    rearSuspensionTravel: 105,
    handlebarType: "raised",
    exShowroomPrice: 220000,
    confidence: "high",
  },
};

/**
 * Discover using mock data (for development)
 */
export function discoverMotorcycleMock(query: string): DiscoveryResult {
  const normalizedQuery = query.toLowerCase().trim();
  const mockData = MOCK_BIKES[normalizedQuery];

  if (mockData) {
    const motorcycle = fillMissingData({
      ...mockData,
      searchQuery: query,
    });

    return {
      success: true,
      motorcycle,
      warnings: ["Using mock data - Gemini API not configured"],
      query,
    };
  }

  return {
    success: false,
    error: `No mock data available for "${query}". Configure GEMINI_API_KEY for real discovery.`,
    warnings: [],
    query,
  };
}

/**
 * Smart discovery - uses real API if available, falls back to mock
 */
export async function smartDiscoverMotorcycle(query: string): Promise<DiscoveryResult> {
  if (isGeminiConfigured()) {
    return discoverMotorcycle(query);
  }
  return discoverMotorcycleMock(query);
}

/**
 * Smart batch discovery
 */
export async function smartDiscoverMotorcycles(
  queries: string[]
): Promise<BatchDiscoveryResult> {
  const startTime = Date.now();

  if (isGeminiConfigured()) {
    return discoverMotorcycles(queries);
  }

  // Use mock data
  const results = queries.map((query) => discoverMotorcycleMock(query));
  const successful = results.filter((r) => r.success).length;

  return {
    results,
    successful,
    failed: queries.length - successful,
    totalTime: Date.now() - startTime,
  };
}
