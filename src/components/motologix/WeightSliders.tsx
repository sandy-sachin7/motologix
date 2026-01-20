"use client";

/**
 * WeightSliders Component
 *
 * Configurable sliders for adjusting factor weights.
 * Weights auto-normalize to sum to 100%.
 */

import { useAppStore } from "@/store/app-store";
import { FACTOR_METADATA, type FactorKey } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  safety: "bg-red-500/20 text-red-400 border-red-500/30",
  comfort: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  practicality: "bg-green-500/20 text-green-400 border-green-500/30",
  enjoyment: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  safety: "🛡️",
  comfort: "🪑",
  practicality: "🔧",
  enjoyment: "🎯",
};

export function WeightSliders() {
  const weights = useAppStore((state) => state.weights);
  const setWeights = useAppStore((state) => state.setWeights);
  const resetWeights = useAppStore((state) => state.resetWeights);
  const runComparison = useAppStore((state) => state.runComparison);
  const motorcycles = useAppStore((state) => state.motorcycles);

  // Group factors by category
  const groupedFactors = FACTOR_METADATA.reduce(
    (acc, factor) => {
      if (!acc[factor.category]) {
        acc[factor.category] = [];
      }
      acc[factor.category].push(factor);
      return acc;
    },
    {} as Record<string, typeof FACTOR_METADATA>
  );

  const handleWeightChange = (key: FactorKey, value: number) => {
    setWeights({ [key]: value / 100 }); // Convert percentage to decimal
  };

  const handleRecalculate = () => {
    if (motorcycles.length > 0) {
      runComparison();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⚖️</span>
              Factor Weights
            </CardTitle>
            <CardDescription>
              Adjust importance of each factor (weights auto-normalize)
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={resetWeights}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedFactors).map(([category, factors]) => (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{CATEGORY_ICONS[category]}</span>
              <h3 className="font-medium capitalize">{category}</h3>
            </div>

            {/* Factors in Category */}
            <div className="space-y-4 pl-7">
              {factors.map((factor) => {
                const weightPercent = Math.round(weights[factor.key] * 100);
                return (
                  <div key={factor.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{factor.label}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${CATEGORY_COLORS[factor.category]}`}
                        >
                          {weightPercent}%
                        </Badge>
                      </div>
                    </div>
                    <Slider
                      value={[weightPercent]}
                      min={0}
                      max={50}
                      step={1}
                      onValueChange={(value) =>
                        handleWeightChange(factor.key, value[0])
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      {factor.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Recalculate Button */}
        {motorcycles.length > 0 && (
          <Button onClick={handleRecalculate} className="w-full" variant="outline">
            <span className="mr-2">🔄</span>
            Recalculate with New Weights
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
