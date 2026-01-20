/**
 * Motologix - Bike Discovery API Route
 *
 * POST /api/discover
 * Body: { queries: string[] }
 * Returns discovered motorcycle specifications
 *
 * Rate limited to 1000 requests per day (RPD)
 */

import { NextRequest, NextResponse } from "next/server";
import { smartDiscoverMotorcycles } from "@/agents/discovery";
import {
  isRateLimited,
  incrementRequestCount,
  getRateLimitStatus,
  formatResetTime,
} from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    if (isRateLimited()) {
      const status = getRateLimitStatus();
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded (1000/day). Resets in ${formatResetTime()}.`,
          rateLimit: status,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { queries } = body;

    // Validate input
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: "queries must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    // Limit to 5 bikes at a time
    if (queries.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 bikes can be discovered at once" },
        { status: 400 }
      );
    }

    // Validate each query
    for (const query of queries) {
      if (typeof query !== "string" || query.trim().length === 0) {
        return NextResponse.json(
          { error: "Each query must be a non-empty string" },
          { status: 400 }
        );
      }
    }

    // Increment rate limit counter (counts each API call, not each bike)
    if (!incrementRequestCount()) {
      return NextResponse.json(
        { error: "Rate limit exceeded while processing request" },
        { status: 429 }
      );
    }

    // Discover motorcycles
    const result = await smartDiscoverMotorcycles(queries.map((q: string) => q.trim()));

    return NextResponse.json({
      success: true,
      data: {
        results: result.results,
        summary: {
          successful: result.successful,
          failed: result.failed,
          totalTime: result.totalTime,
        },
      },
      rateLimit: getRateLimitStatus(),
    });
  } catch (error) {
    console.error("Discovery API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for single bike discovery
export async function GET(request: NextRequest) {
  // Check rate limit
  if (isRateLimited()) {
    const status = getRateLimitStatus();
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded (1000/day). Resets in ${formatResetTime()}.`,
        rateLimit: status,
      },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  // Increment rate limit counter
  if (!incrementRequestCount()) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const result = await smartDiscoverMotorcycles([query.trim()]);
  const bikeResult = result.results[0];

  if (!bikeResult.success) {
    return NextResponse.json(
      { success: false, error: bikeResult.error },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: bikeResult.motorcycle,
    warnings: bikeResult.warnings,
    rateLimit: getRateLimitStatus(),
  });
}

