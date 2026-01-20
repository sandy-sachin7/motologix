"use client";

/**
 * BikeSearch Component
 *
 * Input for searching and adding bikes to compare.
 * Shows added bikes as chips that can be removed.
 * Animated with Framer Motion.
 */

import { useState, KeyboardEvent } from "react";
import { useAppStore } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export function BikeSearch() {
  const [query, setQuery] = useState("");
  const bikeQueries = useAppStore((state) => state.bikeQueries);
  const addBikeQuery = useAppStore((state) => state.addBikeQuery);
  const removeBikeQuery = useAppStore((state) => state.removeBikeQuery);
  const discoverBikes = useAppStore((state) => state.discoverBikes);
  const isDiscovering = useAppStore((state) => state.isDiscovering);

  const handleAdd = () => {
    if (query.trim()) {
      addBikeQuery(query.trim());
      setQuery("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDiscover = async () => {
    await discoverBikes();
  };

  return (
    <Card className="w-full glass-card hover:none transition-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading">
          <span className="text-2xl animate-pulse-soft">🏍️</span>
          Search Motorcycles
        </CardTitle>
        <CardDescription>
          Enter motorcycle names to compare (e.g., "KTM Duke 390", "Himalayan 450")
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Row */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter motorcycle name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDiscovering || bikeQueries.length >= 5}
            className="flex-1 bg-background/50 backdrop-blur-sm border-border/50 focus:ring-primary/20"
          />
          <Button
            onClick={handleAdd}
            disabled={!query.trim() || isDiscovering || bikeQueries.length >= 5}
            variant="outline"
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            Add
          </Button>
        </div>

        {/* Bike Chips */}
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          <AnimatePresence mode="popLayout">
            {bikeQueries.map((bike) => (
              <motion.div
                key={bike}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                layout
              >
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm flex items-center gap-2 bg-secondary/50 backdrop-blur-md border border-border/50"
                >
                  {bike}
                  <button
                    onClick={() => removeBikeQuery(bike)}
                    className="ml-1 hover:text-destructive transition-colors rounded-full w-4 h-4 flex items-center justify-center hover:bg-destructive/10"
                    disabled={isDiscovering}
                  >
                    ×
                  </button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Info/Limits */}
        <div className="text-sm text-muted-foreground flex justify-between items-center">
          <span>
            {bikeQueries.length === 0 ? (
              "Add at least 1 bike to get started"
            ) : (
              `${bikeQueries.length}/5 bikes added`
            )}
          </span>
          {bikeQueries.length >= 5 && (
            <span className="text-yellow-500 text-xs">Max limit reached</span>
          )}
        </div>

        {/* Compare Button */}
        <Button
          onClick={handleDiscover}
          disabled={bikeQueries.length === 0 || isDiscovering}
          className="w-full relative overflow-hidden"
          size="lg"
        >
          {isDiscovering ? (
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                ⚙️
              </motion.span>
              <span>Discovering...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <motion.span
                whileHover={{ scale: 1.2, rotate: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                🔍
              </motion.span>
              <span>Compare {bikeQueries.length} Bike{bikeQueries.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
