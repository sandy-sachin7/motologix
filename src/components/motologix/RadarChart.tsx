"use client";

/**
 * RadarChart Component
 *
 * Visualizes factor scores as a radar/spider chart.
 * Optimized for both light and dark modes with vibrant colors.
 */

import { useAppStore } from "@/store/app-store";
import type { FactorKey } from "@/types";
import { FACTOR_METADATA } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Vibrant colors that work in both light and dark modes
const CHART_COLORS = [
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
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

    bikesToShow.forEach((bike) => {
      const bikeName = `${bike.motorcycle.brand} ${bike.motorcycle.model}`;
      dataPoint[bikeName] = bike.factorScores[factor.key as FactorKey];
    });

    return dataPoint;
  });

  return (
    <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>📊</span>
          Factor Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid
                gridType="polygon"
                stroke="currentColor"
                strokeOpacity={0.15}
              />
              <PolarAngleAxis
                dataKey="factor"
                tick={{
                  fill: "currentColor",
                  fontSize: 11,
                  opacity: 0.7,
                }}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 10]}
                tick={{
                  fill: "currentColor",
                  fontSize: 10,
                  opacity: 0.5,
                }}
                tickCount={6}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              {bikesToShow.map((bike, index) => {
                const bikeName = `${bike.motorcycle.brand} ${bike.motorcycle.model}`;
                const color = CHART_COLORS[index % CHART_COLORS.length];
                return (
                  <Radar
                    key={bikeName}
                    name={bikeName}
                    dataKey={bikeName}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.25}
                    strokeWidth={2.5}
                    dot={{
                      r: 3,
                      fill: color,
                      strokeWidth: 0,
                    }}
                    activeDot={{
                      r: 5,
                      fill: color,
                      stroke: "white",
                      strokeWidth: 2,
                    }}
                  />
                );
              })}
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value: string) => (
                  <span style={{ color: "currentColor", opacity: 0.9 }}>{value}</span>
                )}
              />
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with scores */}
        <div className="flex flex-wrap justify-center gap-4 mt-2 pt-2 border-t border-border/50">
          {bikesToShow.map((bike, index) => (
            <div key={bike.motorcycle.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-sm font-medium">
                {bike.motorcycle.brand} {bike.motorcycle.model}
              </span>
              <span className="text-sm text-muted-foreground">
                ({bike.finalScore})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
