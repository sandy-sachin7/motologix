"use client";

/**
 * RadarChart Component
 *
 * Visualizes factor scores as a radar/spider chart.
 */

import { useAppStore } from "@/store/app-store";
import type { ScoredMotorcycle, FactorKey } from "@/types";
import { FACTOR_METADATA } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// Colors for different bikes
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface RadarChartProps {
  showOnlyTop?: number; // Limit to top N bikes
}

export function RadarChart({ showOnlyTop = 3 }: RadarChartProps) {
  const scoredMotorcycles = useAppStore((state) => state.scoredMotorcycles);

  if (scoredMotorcycles.length === 0) {
    return null;
  }

  // Limit to top N bikes for readability
  const bikesToShow = scoredMotorcycles.slice(0, showOnlyTop);

  // Prepare data for radar chart
  // Each data point is a factor, with values for each bike
  const chartData = FACTOR_METADATA.map((factor) => {
    const dataPoint: Record<string, string | number> = {
      factor: factor.label.split(" ")[0], // Short label for radar
      fullLabel: factor.label,
    };

    bikesToShow.forEach((bike, index) => {
      const bikeName = `${bike.motorcycle.brand} ${bike.motorcycle.model}`;
      dataPoint[bikeName] = bike.factorScores[factor.key as FactorKey];
    });

    return dataPoint;
  });

  // Chart config for shadcn chart
  const chartConfig: ChartConfig = bikesToShow.reduce((config, bike, index) => {
    const bikeName = `${bike.motorcycle.brand} ${bike.motorcycle.model}`;
    config[bikeName] = {
      label: bikeName,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return config;
  }, {} as ChartConfig);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Factor Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[400px]">
          <RechartsRadarChart data={chartData}>
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis
              dataKey="factor"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 10]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {bikesToShow.map((bike, index) => {
              const bikeName = `${bike.motorcycle.brand} ${bike.motorcycle.model}`;
              return (
                <Radar
                  key={bikeName}
                  name={bikeName}
                  dataKey={bikeName}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              );
            })}
          </RechartsRadarChart>
        </ChartContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {bikesToShow.map((bike, index) => (
            <div key={bike.motorcycle.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-sm">
                {bike.motorcycle.brand} {bike.motorcycle.model} ({bike.finalScore})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
