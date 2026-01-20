"use client";

/**
 * WeightSliders Component
 *
 * Configurable sliders for adjusting factor weights.
 * Weights auto-normalize to sum to 100%.
 * Illustrated with icons and Framer Motion animations.
 */

import { useAppStore } from "@/store/app-store";
import { FACTOR_METADATA, type FactorKey } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  safety: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  comfort: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  practicality: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  enjoyment: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
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
    <Card className="w-full glass-card hover:none transition-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="text-2xl animate-pulse-soft">⚖️</span>
              Factor Weights
            </CardTitle>
            <CardDescription>
              Adjust importance of each factor (weights auto-normalize)
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={resetWeights} className="hover:text-primary">
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedFactors).map(([category, factors], categoryIndex) => (
          <motion.div
            key={category}
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            {/* Category Header */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{CATEGORY_ICONS[category]}</span>
              <h3 className="font-medium capitalize text-foreground/90">{category}</h3>
            </div>

            {/* Factors in Category */}
            <div className="space-y-5 pl-7 border-l-2 border-border/50 ml-2">
              {factors.map((factor, factorIndex) => {
                const weightPercent = Math.round(weights[factor.key] * 100);
                return (
                  <motion.div
                    key={factor.key}
                    className="space-y-2 group"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{factor.label}</span>
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
                      className="w-full cursor-pointer py-1"
                    />
                    <p className="text-[10px] text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                      {factor.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Recalculate Button */}
        {motorcycles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button onClick={handleRecalculate} className="w-full relative overflow-hidden group" variant="default">
              <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="mr-2 group-hover:rotate-180 transition-transform duration-500">🔄</span>
              <span className="relative z-10">Recalculate with New Weights</span>
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
