"use client";

/**
 * Explanation Component
 *
 * Shows AI-generated explanations with Parent Mode toggle.
 */

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Explanation() {
  const comparison = useAppStore((state) => state.comparison);
  const parentModeEnabled = useAppStore((state) => state.parentModeEnabled);
  const setParentModeEnabled = useAppStore((state) => state.setParentModeEnabled);

  if (!comparison) {
    return null;
  }

  const explanation = parentModeEnabled
    ? comparison.parentModeExplanation
    : comparison.explanation;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              {parentModeEnabled ? "Simple Explanation" : "Why This Ranking?"}
            </CardTitle>
            <CardDescription>
              {parentModeEnabled
                ? "Easy-to-understand summary for everyone"
                : "Technical analysis of the comparison"}
            </CardDescription>
          </div>
          <Button
            variant={parentModeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setParentModeEnabled(!parentModeEnabled)}
          >
            <span className="mr-1">👨‍👩‍👧</span>
            Parent Mode
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main explanation */}
        <p className="text-base leading-relaxed">{explanation}</p>

        {/* Trade-offs */}
        {comparison.tradeoffs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <span>⚖️</span> Trade-offs to Consider
            </h4>
            <ul className="space-y-1">
              {comparison.tradeoffs.map((tradeoff, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-yellow-500">•</span>
                  {tradeoff}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {parentModeEnabled ? "Simplified" : "Technical"}
          </Badge>
          <span>
            Generated at{" "}
            {new Date(comparison.generatedAt).toLocaleTimeString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
