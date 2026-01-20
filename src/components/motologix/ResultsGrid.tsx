"use client";

/**
 * ResultsGrid Component
 *
 * Displays ranked motorcycle results as cards with staggered animations.
 */

import { useAppStore } from "@/store/app-store";
import type { ScoredMotorcycle } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { motion, AnimatePresence } from "framer-motion";

// Rank badges
function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    2: "bg-zinc-200/50 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-200 border-zinc-500/20",
    3: "bg-amber-700/10 text-amber-700 dark:text-amber-500 border-amber-600/20",
  };

  const emojis: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  return (
    <Badge variant="outline" className={`${colors[rank] || "bg-zinc-600"} text-lg px-3 py-1 border`}>
      {emojis[rank] || `#${rank}`}
    </Badge>
  );
}

// Confidence indicator
function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    low: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
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
function ResultCard({ scoredBike, isTop, index }: { scoredBike: ScoredMotorcycle; isTop: boolean; index: number }) {
  const bike = scoredBike.motorcycle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className={`w-full transition-colors glass-card ${isTop ? "border-primary/50 bg-primary/5" : "hover:border-primary/20"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <RankBadge rank={scoredBike.rank} />
                <CardTitle className="text-xl font-heading">
                  {bike.brand} {bike.model}
                </CardTitle>
                {isTop && (
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    Winner
                  </Badge>
                )}
              </div>
              <CardDescription>
                {bike.year && `${bike.year} · `}
                {bike.engineCC}cc · {bike.power} bhp · {bike.kerbWeight} kg
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{scoredBike.finalScore}</div>
              <div className="text-xs text-muted-foreground">/100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="space-y-1 p-2 rounded-md bg-muted/50">
              <div className="text-muted-foreground text-xs uppercase tracking-wider">ABS</div>
              <div className="font-medium capitalize">{bike.absType.replace("-", " ")}</div>
            </div>
            <div className="space-y-1 p-2 rounded-md bg-muted/50">
              <div className="text-muted-foreground text-xs uppercase tracking-wider">Seat Height</div>
              <div className="font-medium">{bike.seatHeight} mm</div>
            </div>
            <div className="space-y-1 p-2 rounded-md bg-muted/50">
              <div className="text-muted-foreground text-xs uppercase tracking-wider">Wheelbase</div>
              <div className="font-medium">{bike.wheelbase} mm</div>
            </div>
            <div className="space-y-1 p-2 rounded-md bg-muted/50">
              <div className="text-muted-foreground text-xs uppercase tracking-wider">Fuel</div>
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
          {bike.exShowroomPrice && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ex-showroom Price</span>
                <span className="font-bold text-lg font-mono">
                  ₹{(bike.exShowroomPrice / 100000).toFixed(2)} Lakh
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground text-right mt-1">* varies by state</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ResultsGrid() {
  const scoredMotorcycles = useAppStore((state) => state.scoredMotorcycles);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);

  if (isLoading) {
    return (
      <Card className="w-full glass-card">
        <CardContent className="py-12 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="text-4xl mb-4 inline-block"
          >
            ⚙️
          </motion.div>
          <p className="text-muted-foreground animate-pulse">Analyzing motorcycles...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && scoredMotorcycles.length === 0) {
    return (
      <Card className="w-full border-destructive/50 bg-destructive/5">
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Card className="w-full glass-card border-dashed">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4 grayscale opacity-50">🏍️</div>
            <p className="text-muted-foreground">
              Add bikes and click Compare to see results
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
          <span>📊</span> Results
        </h2>
        <Badge variant="secondary" className="font-mono">{scoredMotorcycles.length} bikes compared</Badge>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-3 text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ {error}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {scoredMotorcycles.map((scoredBike, index) => (
            <ResultCard
              key={scoredBike.motorcycle.id}
              scoredBike={scoredBike}
              isTop={index === 0}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
