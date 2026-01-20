/**
 * Motologix - Gemini API Client
 *
 * Wrapper for Google Gemini API with search grounding.
 * Used for bike discovery and explanation generation.
 */

import { GoogleGenerativeAI, GoogleGenerativeAIError } from "@google/generative-ai";

// ============================================
// CLIENT SETUP
// ============================================

let genAI: GoogleGenerativeAI | null = null;

/**
 * Get or create the Gemini client
 */
export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error(
        "GEMINI_API_KEY is not configured. Please set it in .env.local"
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !!(apiKey && apiKey !== "your_api_key_here");
}

// ============================================
// MODEL CONFIGURATION
// ============================================

const DISCOVERY_MODEL = "gemini-2.0-flash";
const REASONING_MODEL = "gemini-2.0-flash";

// ============================================
// PROMPTS
// ============================================

const BIKE_DISCOVERY_PROMPT = `You are a motorcycle specification expert with access to current information about motorcycles available in India.

Given a motorcycle name/query, extract and return ACCURATE specifications in JSON format. Use bikewale.com, zigwheels.com, and official manufacturer sites as reference sources.

CRITICAL RULES:
1. ONLY return data for the LATEST 2025 variant (or 2024 if 2025 is not yet available)
2. If a specification is unknown, omit it or set to null
3. Use metric units (mm, kg, bhp, Nm)
4. For Indian market bikes, use Indian variant specs
5. Be precise with ABS type (none, single-channel, dual-channel)
6. Price MUST be EX-SHOWROOM price in INR (not on-road price)
7. Always specify the variant name if multiple variants exist

Return a JSON object with this structure:
{
  "brand": "string",
  "model": "string",
  "variant": "string (top/base variant name)",
  "year": 2025 (or 2024 if 2025 not available),
  "engineCC": number,
  "power": number (bhp),
  "torque": number (Nm),
  "kerbWeight": number (kg),
  "seatHeight": number (mm),
  "wheelbase": number (mm),
  "groundClearance": number (mm),
  "fuelCapacity": number (liters),
  "frontBrake": "disc" or "drum",
  "rearBrake": "disc" or "drum",
  "absType": "none" or "single-channel" or "dual-channel",
  "frontTyreWidth": number (mm),
  "rearTyreWidth": number (mm),
  "frontSuspension": "string describing type",
  "rearSuspension": "monoshock" or "twin" or "other",
  "rearSuspensionTravel": number (mm, if known),
  "handlebarType": "clip-on" or "standard" or "raised",
  "exShowroomPrice": number (EX-SHOWROOM price in INR, NOT on-road),
  "confidence": "high" or "medium" or "low",
  "sources": ["list of sources used"]
}

Motorcycle query: `;


const BIKE_EXPLANATION_PROMPT = `You are Motologix, an explainable motorcycle recommendation system. Your role is to explain WHY a motorcycle scored the way it did.

RULES:
1. Be factual and calm - no hype or marketing language
2. Explain trade-offs honestly
3. Use simple language a parent or non-enthusiast can understand
4. Always mention safety-related factors prominently
5. Be concise but thorough

Given the scoring data below, provide:
1. A technical explanation (2-3 sentences)
2. A "Parent Mode" explanation (simple, focuses on safety and practicality)
3. Key trade-offs (bullet points)

`;

const COMPARISON_PROMPT = `You are Motologix, explaining why one motorcycle ranked higher than another.

RULES:
1. Be objective and fair to both bikes
2. Highlight the key differentiating factors
3. Acknowledge where the lower-ranked bike excels
4. Use simple language
5. Focus on the user's priorities (their weight configuration)

`;

// ============================================
// API FUNCTIONS
// ============================================

export interface BikeDiscoveryResult {
  brand: string;
  model: string;
  variant?: string;
  year?: number;
  engineCC: number;
  power: number;
  torque: number;
  kerbWeight: number;
  seatHeight: number;
  wheelbase: number;
  groundClearance: number;
  fuelCapacity: number;
  frontBrake: "disc" | "drum";
  rearBrake: "disc" | "drum";
  absType: "none" | "single-channel" | "dual-channel";
  frontTyreWidth: number;
  rearTyreWidth: number;
  frontSuspension: string;
  rearSuspension: "monoshock" | "twin" | "other";
  rearSuspensionTravel?: number;
  handlebarType?: "clip-on" | "standard" | "raised";
  exShowroomPrice?: number;
  confidence: "high" | "medium" | "low";
  sources: string[];
}

/**
 * Discover motorcycle specifications using Gemini
 */
export async function discoverBike(query: string): Promise<BikeDiscoveryResult> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: DISCOVERY_MODEL });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: BIKE_DISCOVERY_PROMPT + query }],
        },
      ],
      generationConfig: {
        temperature: 0.2, // Low temperature for factual accuracy
        topP: 0.8,
        maxOutputTokens: 2000,
      },
    });

    const response = result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                      text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in Gemini response");
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const data = JSON.parse(jsonStr) as BikeDiscoveryResult;

    // Validate required fields
    if (!data.brand || !data.model) {
      throw new Error("Missing required fields in response");
    }

    return {
      ...data,
      confidence: data.confidence || "medium",
      sources: data.sources || ["Gemini AI"],
    };
  } catch (error) {
    if (error instanceof GoogleGenerativeAIError) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Discover multiple bikes in parallel
 */
export async function discoverBikes(
  queries: string[]
): Promise<Map<string, BikeDiscoveryResult | Error>> {
  const results = new Map<string, BikeDiscoveryResult | Error>();

  // Run all discoveries in parallel
  const promises = queries.map(async (query) => {
    try {
      const bike = await discoverBike(query);
      results.set(query, bike);
    } catch (error) {
      results.set(query, error instanceof Error ? error : new Error(String(error)));
    }
  });

  await Promise.all(promises);
  return results;
}

export interface ExplanationResult {
  technicalExplanation: string;
  parentModeExplanation: string;
  tradeoffs: string[];
  confidence: "high" | "medium" | "low";
}

/**
 * Generate explanation for a scored motorcycle
 */
export async function generateExplanation(
  bikeName: string,
  finalScore: number,
  factorScores: Record<string, number>,
  rank: number,
  totalBikes: number
): Promise<ExplanationResult> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: REASONING_MODEL });

  const context = `
Motorcycle: ${bikeName}
Final Score: ${finalScore}/100
Rank: ${rank} of ${totalBikes}

Factor Scores (1-10):
${Object.entries(factorScores)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

Please provide your analysis:
`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: BIKE_EXPLANATION_PROMPT + context }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 1500,
      },
    });

    const response = result.response;
    const text = response.text();

    // Parse the response (it may not be JSON, so we parse sections)
    const technicalMatch = text.match(/(?:technical|explanation)[:\s]*([^]*?)(?:parent|simple|$)/i);
    const parentMatch = text.match(/(?:parent mode|simple)[:\s]*([^]*?)(?:trade-?offs?|key|$)/i);
    const tradeoffsMatch = text.match(/(?:trade-?offs?|key)[:\s]*([^]*?)$/i);

    const technical = technicalMatch?.[1]?.trim() || text.slice(0, 300);
    const parent = parentMatch?.[1]?.trim() || technical;

    // Extract bullet points for tradeoffs
    const tradeoffsText = tradeoffsMatch?.[1] || "";
    const tradeoffs = tradeoffsText
      .split(/[-•*]\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 10 && t.length < 200);

    return {
      technicalExplanation: technical.slice(0, 500),
      parentModeExplanation: parent.slice(0, 500),
      tradeoffs: tradeoffs.slice(0, 5),
      confidence: "medium",
    };
  } catch (error) {
    // Return fallback explanation
    return {
      technicalExplanation: `${bikeName} scored ${finalScore}/100 based on the configured factor weights.`,
      parentModeExplanation: `This motorcycle ranked #${rank} in the comparison.`,
      tradeoffs: ["Unable to generate detailed analysis"],
      confidence: "low",
    };
  }
}

/**
 * Generate comparison explanation between bikes
 */
export async function generateComparisonExplanation(
  winner: { name: string; score: number },
  loser: { name: string; score: number },
  keyDifferences: Array<{ factor: string; winnerScore: number; loserScore: number }>
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: REASONING_MODEL });

  const context = `
Winner: ${winner.name} (Score: ${winner.score}/100)
Runner-up: ${loser.name} (Score: ${loser.score}/100)

Key differences:
${keyDifferences
  .slice(0, 5)
  .map((d) => `- ${d.factor}: ${winner.name} (${d.winnerScore}) vs ${loser.name} (${d.loserScore})`)
  .join("\n")}

Explain why ${winner.name} ranked higher in 2-3 sentences:
`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: COMPARISON_PROMPT + context }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    return result.response.text().trim();
  } catch {
    return `${winner.name} scored ${winner.score - loser.score} points higher than ${loser.name}, primarily due to differences in key factors.`;
  }
}
