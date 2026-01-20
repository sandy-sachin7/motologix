// Motologix Type Definitions

// ============================================
// MOTORCYCLE
// ============================================

export interface Motorcycle {
  id: string;

  // Identity
  brand: string;
  model: string;
  variant?: string;
  year?: number;

  // Core Specs
  engineCC: number;
  power: number; // bhp
  torque: number; // Nm
  kerbWeight: number; // kg

  // Dimensions
  seatHeight: number; // mm
  wheelbase: number; // mm
  groundClearance: number; // mm
  fuelCapacity: number; // liters

  // Braking
  frontBrake: "disc" | "drum";
  rearBrake: "disc" | "drum";
  absType: "none" | "single-channel" | "dual-channel";
  frontTyreWidth: number; // mm
  rearTyreWidth: number; // mm

  // Suspension
  frontSuspension: string;
  rearSuspension: "monoshock" | "twin" | "other";
  rearSuspensionTravel?: number; // mm

  // Ergonomics
  handlebarType?: "clip-on" | "standard" | "raised";

  // Practical
  exShowroomPrice?: number; // Ex-showroom INR

  // AI-derived
  reviewSummary?: string;
  heatManagementRating?: number; // 1-10

  // Metadata
  confidence: "high" | "medium" | "low";
  searchQuery: string; // original user input
}

// ============================================
// FACTOR WEIGHTS & SCORES
// ============================================

export interface FactorWeights {
  dailyTrafficEase: number; // default: 0.12
  brakingSafetyConfidence: number; // default: 0.15
  primaryPillionComfort: number; // default: 0.15
  highwayStability: number; // default: 0.10
  riderComfort: number; // default: 0.10
  suspensionCompliance: number; // default: 0.10
  funEngagement: number; // default: 0.08
  heatManagement: number; // default: 0.05
  ownershipPracticality: number; // default: 0.08
  longTermSuitability: number; // default: 0.07
}

export type FactorKey = keyof FactorWeights;

export interface FactorScores {
  dailyTrafficEase: number; // 1-10
  brakingSafetyConfidence: number;
  primaryPillionComfort: number;
  highwayStability: number;
  riderComfort: number;
  suspensionCompliance: number;
  funEngagement: number;
  heatManagement: number;
  ownershipPracticality: number;
  longTermSuitability: number;
}

export interface ScoredMotorcycle {
  motorcycle: Motorcycle;
  factorScores: FactorScores;
  finalScore: number; // 0-100
  rank: number;
  confidences: Record<FactorKey, "high" | "medium" | "low">;
}

// ============================================
// COMPARISON & RESULTS
// ============================================

export type PillionMode = "primary" | "secondary" | "none";

export interface ComparisonResult {
  motorcycles: ScoredMotorcycle[];
  explanation?: string;
  parentModeExplanation?: string;
  tradeoffs: string[];
  generatedAt: Date;
}

// ============================================
// APP STATE
// ============================================

export interface AppState {
  // User inputs
  bikeQueries: string[];
  weights: FactorWeights;
  pillionMode: PillionMode;

  // Fetched data
  motorcycles: Motorcycle[];

  // Results
  comparison: ComparisonResult | null;

  // UI state
  isLoading: boolean;
  isDiscovering: boolean;
  error: string | null;

  // Actions
  addBikeQuery: (query: string) => void;
  removeBikeQuery: (query: string) => void;
  setWeights: (weights: Partial<FactorWeights>) => void;
  setPillionMode: (mode: PillionMode) => void;
  discoverBikes: () => Promise<void>;
  runComparison: () => void;
  reset: () => void;
}

// ============================================
// AI / GEMINI
// ============================================

export interface GeminiDiscoveryResult {
  motorcycle: Partial<Motorcycle>;
  confidence: "high" | "medium" | "low";
  sources: string[];
}

export interface GeminiExplanationResult {
  explanation: string;
  parentModeExplanation: string;
  tradeoffs: string[];
  confidence: "high" | "medium" | "low";
}

// ============================================
// FACTOR METADATA
// ============================================

export interface FactorMeta {
  key: FactorKey;
  label: string;
  description: string;
  category: "safety" | "comfort" | "practicality" | "enjoyment";
  defaultWeight: number;
}

export const FACTOR_METADATA: FactorMeta[] = [
  {
    key: "dailyTrafficEase",
    label: "Daily Traffic Ease",
    description: "How easy is the bike to maneuver in heavy traffic",
    category: "practicality",
    defaultWeight: 0.12,
  },
  {
    key: "brakingSafetyConfidence",
    label: "Braking & Safety",
    description: "Confidence in braking performance and safety features",
    category: "safety",
    defaultWeight: 0.15,
  },
  {
    key: "primaryPillionComfort",
    label: "Pillion Comfort",
    description: "Comfort and safety for pillion riders",
    category: "comfort",
    defaultWeight: 0.15,
  },
  {
    key: "highwayStability",
    label: "Highway Stability",
    description: "Stability and confidence at highway speeds",
    category: "safety",
    defaultWeight: 0.1,
  },
  {
    key: "riderComfort",
    label: "Rider Comfort",
    description: "Long-ride comfort for the rider",
    category: "comfort",
    defaultWeight: 0.1,
  },
  {
    key: "suspensionCompliance",
    label: "Suspension Quality",
    description: "How well the suspension handles Indian roads",
    category: "comfort",
    defaultWeight: 0.1,
  },
  {
    key: "funEngagement",
    label: "Fun & Engagement",
    description: "How enjoyable and engaging the riding experience is",
    category: "enjoyment",
    defaultWeight: 0.08,
  },
  {
    key: "heatManagement",
    label: "Heat Management",
    description: "How well the bike manages engine heat in traffic",
    category: "practicality",
    defaultWeight: 0.05,
  },
  {
    key: "ownershipPracticality",
    label: "Ownership Practicality",
    description: "Service network, reliability, parts availability",
    category: "practicality",
    defaultWeight: 0.08,
  },
  {
    key: "longTermSuitability",
    label: "Long-Term Suitability",
    description: "Suitability for 9+ years of ownership",
    category: "practicality",
    defaultWeight: 0.07,
  },
];

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_WEIGHTS: FactorWeights = {
  dailyTrafficEase: 0.12,
  brakingSafetyConfidence: 0.15,
  primaryPillionComfort: 0.15,
  highwayStability: 0.1,
  riderComfort: 0.1,
  suspensionCompliance: 0.1,
  funEngagement: 0.08,
  heatManagement: 0.05,
  ownershipPracticality: 0.08,
  longTermSuitability: 0.07,
};

export const EMPTY_FACTOR_SCORES: FactorScores = {
  dailyTrafficEase: 5,
  brakingSafetyConfidence: 5,
  primaryPillionComfort: 5,
  highwayStability: 5,
  riderComfort: 5,
  suspensionCompliance: 5,
  funEngagement: 5,
  heatManagement: 5,
  ownershipPracticality: 5,
  longTermSuitability: 5,
};
