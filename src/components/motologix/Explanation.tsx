"use client";

/**
 * Explanation Component
 *
 * Shows AI-generated explanations with Parent Mode toggle.
 * Animated with Framer Motion.
 */

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="w-full glass-card hover:none transition-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-heading">
                <span className="text-2xl animate-bounce-subtle">💡</span>
                {parentModeEnabled ? "Simple Explanation" : "Why This Ranking?"}
              </CardTitle>
              <CardDescription>
                {parentModeEnabled
                  ? "Easy-to-understand summary for everyone"
                  : "Technical analysis of the comparison"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg border border-border/50">
              <span className="text-sm font-medium mr-2 hidden sm:inline-block">
                {parentModeEnabled ? "Parent Mode ON" : "Parent Mode OFF"}
              </span>
              <Switch
                checked={parentModeEnabled}
                onCheckedChange={setParentModeEnabled}
                className="data-[state=checked]:bg-green-500"
              />
              <span className="text-xl">{parentModeEnabled ? "👨‍👩‍👧" : "🔧"}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main explanation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={parentModeEnabled ? "parent" : "technical"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-base leading-relaxed p-4 rounded-lg bg-background/40 border border-border/40">
                {explanation}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Trade-offs */}
          {comparison.tradeoffs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-medium flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <span>⚖️</span> Trade-offs to Consider
              </h4>
              <ul className="space-y-2">
                {comparison.tradeoffs.map((tradeoff, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-sm text-muted-foreground flex items-start gap-2 bg-secondary/20 p-2 rounded border border-border/20"
                  >
                    <span className="text-orange-500 mt-0.5">•</span>
                    {tradeoff}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] h-5">
              {parentModeEnabled ? "Simplified" : "Technical"}
            </Badge>
            <span>
              Generated at{" "}
              {new Date(comparison.generatedAt).toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
