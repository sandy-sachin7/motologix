"use client";

/**
 * ResultsGrid Component
 *
 * Displays ranked motorcycle results as cards.
 */

import { useAppStore } from "@/store/app-store";
import type { ScoredMotorcycle } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBreakdown } from "./ScoreBreakdown";

// Rank badges
function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-yellow-500 text-yellow-950",
    2: "bg-gray-300 text-gray-800",
    3: "bg-amber-600 text-amber-50",
  };

  const emojis: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  return (
    <Badge className={`${colors[rank] || "bg-zinc-600"} text-lg px-3 py-1`}>
      {emojis[rank] || `#${rank}`}
    </Badge>
  );
}

// Confidence indicator
function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const icons = {
    high: "🟢",
    medium: "🟡",
    low: "🔴",
  };

  return (
    <Badge variant="outline" className={colors[confidence]}>
      {icons[confidence]} {confidence}
    </Badge>
  );
}

// Single result card
function ResultCard({ scoredBike, isTop }: { scoredBike: ScoredMotorcycle; isTop: boolean }) {
  const bike = scoredBike.motorcycle;

  return (
    <Card className={`w-full ${isTop ? "border-yellow-500/50 bg-yellow-500/5" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <RankBadge rank={scoredBike.rank} />
              <CardTitle className="text-xl">
                {bike.brand} {bike.model}
              </CardTitle>
            </div>
            <CardDescription>
              {bike.year && `${bike.year} · `}
              {bike.engineCC}cc · {bike.power} bhp · {bike.kerbWeight} kg
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{scoredBike.finalScore}</div>
            <div className="text-xs text-muted-foreground">/100</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">ABS</div>
            <div className="font-medium capitalize">{bike.absType.replace("-", " ")}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Seat Height</div>
            <div className="font-medium">{bike.seatHeight} mm</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Wheelbase</div>
            <div className="font-medium">{bike.wheelbase} mm</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Fuel</div>
            <div className="font-medium">{bike.fuelCapacity} L</div>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Data confidence:</span>
          <ConfidenceBadge confidence={bike.confidence} />
        </div>

        {/* Score breakdown */}
        <ScoreBreakdown scoredBike={scoredBike} />

        {/* Price if available */}
        {bike.estimatedPrice && (
          <div className="pt-2 border-t">
            <span className="text-sm text-muted-foreground">Est. Price: </span>
            <span className="font-medium">
              ₹{(bike.estimatedPrice / 100000).toFixed(2)} Lakh
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResultsGrid() {
  const scoredMotorcycles = useAppStore((state) => state.scoredMotorcycles);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="py-12 text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-muted-foreground">Analyzing motorcycles...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && scoredMotorcycles.length === 0) {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="py-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-destructive font-medium">Error</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (scoredMotorcycles.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-12 text-center">
          <div className="text-4xl mb-4">🏍️</div>
          <p className="text-muted-foreground">
            Add bikes and click Compare to see results
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>📊</span> Results
        </h2>
        <Badge variant="secondary">{scoredMotorcycles.length} bikes compared</Badge>
      </div>

      {error && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="py-3 text-sm text-yellow-400">
            ⚠️ {error}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {scoredMotorcycles.map((scoredBike, index) => (
          <ResultCard
            key={scoredBike.motorcycle.id}
            scoredBike={scoredBike}
            isTop={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
