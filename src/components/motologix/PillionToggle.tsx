"use client";

/**
 * PillionToggle Component
 *
 * Toggle between pillion modes:
 * - None: No pillion consideration
 * - Primary: Peer/girlfriend (comfort important)
 * - Secondary: Parents (stability and safety critical)
 */

import { useAppStore } from "@/store/app-store";
import type { PillionMode } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PILLION_OPTIONS: Array<{
  value: PillionMode;
  label: string;
  emoji: string;
  description: string;
}> = [
  {
    value: "none",
    label: "Solo",
    emoji: "🏍️",
    description: "Riding solo, no pillion factor",
  },
  {
    value: "primary",
    label: "Peer/Partner",
    emoji: "👫",
    description: "Comfort important, tolerance higher",
  },
  {
    value: "secondary",
    label: "Parents",
    emoji: "👨‍👩‍👦",
    description: "Stability and safety perception prioritized",
  },
];

export function PillionToggle() {
  const pillionMode = useAppStore((state) => state.pillionMode);
  const setPillionMode = useAppStore((state) => state.setPillionMode);
  const runComparison = useAppStore((state) => state.runComparison);
  const motorcycles = useAppStore((state) => state.motorcycles);

  const handleChange = (value: string) => {
    setPillionMode(value as PillionMode);
    // Auto-recalculate if we have bikes
    if (motorcycles.length > 0) {
      setTimeout(() => runComparison(), 100);
    }
  };

  const currentOption = PILLION_OPTIONS.find((o) => o.value === pillionMode);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-xl">🧑‍🤝‍🧑</span>
          Pillion Mode
        </CardTitle>
        <CardDescription>Who will you be carrying?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={pillionMode} onValueChange={handleChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {PILLION_OPTIONS.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="flex items-center gap-1"
              >
                <span>{option.emoji}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {currentOption && (
          <p className="text-sm text-muted-foreground text-center">
            {currentOption.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
