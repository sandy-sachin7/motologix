"use client";

/**
 * BikeSearch Component
 *
 * Input for searching and adding bikes to compare.
 * Shows added bikes as chips that can be removed.
 */

import { useState, KeyboardEvent } from "react";
import { useAppStore } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏍️</span>
          Search Motorcycles
        </CardTitle>
        <CardDescription>
          Enter motorcycle names to compare (e.g., "KTM Duke 390", "Royal Enfield Himalayan")
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
            className="flex-1"
          />
          <Button
            onClick={handleAdd}
            disabled={!query.trim() || isDiscovering || bikeQueries.length >= 5}
            variant="outline"
          >
            Add
          </Button>
        </div>

        {/* Bike Chips */}
        {bikeQueries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {bikeQueries.map((bike) => (
              <Badge
                key={bike}
                variant="secondary"
                className="px-3 py-1 text-sm flex items-center gap-2"
              >
                {bike}
                <button
                  onClick={() => removeBikeQuery(bike)}
                  className="ml-1 hover:text-destructive"
                  disabled={isDiscovering}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Info/Limits */}
        <div className="text-sm text-muted-foreground">
          {bikeQueries.length === 0 ? (
            "Add at least 1 bike to get started"
          ) : (
            `${bikeQueries.length}/5 bikes added`
          )}
        </div>

        {/* Compare Button */}
        <Button
          onClick={handleDiscover}
          disabled={bikeQueries.length === 0 || isDiscovering}
          className="w-full"
          size="lg"
        >
          {isDiscovering ? (
            <>
              <span className="animate-spin mr-2">⚙️</span>
              Discovering...
            </>
          ) : (
            <>
              <span className="mr-2">🔍</span>
              Compare {bikeQueries.length} Bike{bikeQueries.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
