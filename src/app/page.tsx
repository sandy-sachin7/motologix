"use client";

/**
 * Motologix - Main Application Page
 *
 * AI-powered motorcycle decision system
 * "AI assists. Math decides. Humans approve."
 */

import {
  BikeSearch,
  WeightSliders,
  PillionToggle,
  ResultsGrid,
  Explanation,
  RadarChart,
  ExportButton,
} from "@/components/motologix";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

export default function Home() {
  const reset = useAppStore((state) => state.reset);
  const scoredMotorcycles = useAppStore((state) => state.scoredMotorcycles);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏍️</span>
            <div>
              <h1 className="text-xl font-bold text-white">Motologix</h1>
              <p className="text-xs text-zinc-500">
                AI assists. Math decides. Humans approve.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton />
            {scoredMotorcycles.length > 0 && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Start Over
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bike Search */}
            <BikeSearch />

            {/* Pillion Toggle */}
            <PillionToggle />

            {/* Weight Sliders */}
            <WeightSliders />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Explanation */}
            <Explanation />

            {/* Radar Chart */}
            <RadarChart />

            {/* Results Grid */}
            <ResultsGrid />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-zinc-500">
          <p>
            <strong>Motologix</strong> - Built for rational motorcycle decisions
          </p>
          <p className="mt-1">
            Scoring is deterministic. AI assists with discovery and explanations.
          </p>
          <p className="mt-2 text-xs">
            Data sources: Gemini AI with search grounding • bikewale.com reference
          </p>
        </div>
      </footer>
    </div>
  );
}

