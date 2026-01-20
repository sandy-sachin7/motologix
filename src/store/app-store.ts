/**
 * Motologix - Application State Store
 *
 * Zustand store for managing application state.
 * In-memory with optional localStorage backup.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Motorcycle,
  FactorWeights,
  PillionMode,
  ComparisonResult,
  ScoredMotorcycle,
} from "@/types";
import { DEFAULT_WEIGHTS } from "@/types";
import { scoreAndRankMotorcycles } from "@/engine/scoring";
import { generateComparisonResult } from "@/agents/reasoning";

// ============================================
// STORE INTERFACE
// ============================================

interface AppState {
  // User inputs
  bikeQueries: string[];
  weights: FactorWeights;
  pillionMode: PillionMode;

  // Fetched data
  motorcycles: Motorcycle[];

  // Results
  scoredMotorcycles: ScoredMotorcycle[];
  comparison: ComparisonResult | null;

  // UI state
  isLoading: boolean;
  isDiscovering: boolean;
  error: string | null;
  parentModeEnabled: boolean;

  // Actions
  addBikeQuery: (query: string) => void;
  removeBikeQuery: (query: string) => void;
  clearBikeQueries: () => void;
  setWeights: (weights: Partial<FactorWeights>) => void;
  resetWeights: () => void;
  setPillionMode: (mode: PillionMode) => void;
  setParentModeEnabled: (enabled: boolean) => void;
  discoverBikes: () => Promise<void>;
  addMotorcycle: (motorcycle: Motorcycle) => void;
  removeMotorcycle: (id: string) => void;
  runComparison: () => Promise<void>;
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  bikeQueries: [],
  weights: { ...DEFAULT_WEIGHTS },
  pillionMode: "primary" as PillionMode,
  motorcycles: [],
  scoredMotorcycles: [],
  comparison: null,
  isLoading: false,
  isDiscovering: false,
  error: null,
  parentModeEnabled: false,
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ==================
      // BIKE QUERIES
      // ==================

      addBikeQuery: (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        const current = get().bikeQueries;
        if (current.includes(trimmed)) return; // No duplicates
        if (current.length >= 5) return; // Max 5 bikes

        set({ bikeQueries: [...current, trimmed] });
      },

      removeBikeQuery: (query: string) => {
        set({
          bikeQueries: get().bikeQueries.filter((q) => q !== query),
          // Also remove the corresponding motorcycle if discovered
          motorcycles: get().motorcycles.filter(
            (m) => m.searchQuery.toLowerCase() !== query.toLowerCase()
          ),
        });
      },

      clearBikeQueries: () => {
        set({ bikeQueries: [], motorcycles: [], scoredMotorcycles: [], comparison: null });
      },

      // ==================
      // WEIGHTS
      // ==================

      setWeights: (partialWeights: Partial<FactorWeights>) => {
        const current = get().weights;
        const updated = { ...current, ...partialWeights };

        // Normalize to sum to 1.0
        const total = Object.values(updated).reduce((sum, w) => sum + w, 0);
        if (total > 0) {
          const normalized: FactorWeights = { ...updated };
          for (const key of Object.keys(normalized) as (keyof FactorWeights)[]) {
            normalized[key] = updated[key] / total;
          }
          set({ weights: normalized });
        } else {
          set({ weights: updated });
        }
      },

      resetWeights: () => {
        set({ weights: { ...DEFAULT_WEIGHTS } });
      },

      // ==================
      // PILLION MODE
      // ==================

      setPillionMode: (mode: PillionMode) => {
        set({ pillionMode: mode });
      },

      // ==================
      // PARENT MODE
      // ==================

      setParentModeEnabled: (enabled: boolean) => {
        set({ parentModeEnabled: enabled });
      },

      // ==================
      // BIKE DISCOVERY
      // ==================

      discoverBikes: async () => {
        const queries = get().bikeQueries;
        if (queries.length === 0) {
          set({ error: "Please add at least one bike to compare" });
          return;
        }

        set({ isDiscovering: true, error: null });

        try {
          const response = await fetch("/api/discover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ queries }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Discovery failed");
          }

          // Extract successful motorcycles
          const motorcycles: Motorcycle[] = data.data.results
            .filter((r: { success: boolean }) => r.success)
            .map((r: { motorcycle: Motorcycle }) => r.motorcycle);

          // Check for failures
          const failures = data.data.results.filter((r: { success: boolean }) => !r.success);
          if (failures.length > 0 && motorcycles.length === 0) {
            throw new Error(
              failures.map((f: { query: string; error: string }) => `${f.query}: ${f.error}`).join("; ")
            );
          }

          set({
            motorcycles,
            isDiscovering: false,
            error:
              failures.length > 0
                ? `Some bikes couldn't be found: ${failures.map((f: { query: string }) => f.query).join(", ")}`
                : null,
          });

          // Auto-run comparison if we have bikes
          if (motorcycles.length > 0) {
            get().runComparison();
          }
        } catch (error) {
          set({
            isDiscovering: false,
            error: error instanceof Error ? error.message : "Discovery failed",
          });
        }
      },

      // ==================
      // MOTORCYCLES
      // ==================

      addMotorcycle: (motorcycle: Motorcycle) => {
        const current = get().motorcycles;
        if (current.find((m) => m.id === motorcycle.id)) return;
        set({ motorcycles: [...current, motorcycle] });
      },

      removeMotorcycle: (id: string) => {
        set({
          motorcycles: get().motorcycles.filter((m) => m.id !== id),
        });
      },

      // ==================
      // COMPARISON
      // ==================

      runComparison: async () => {
        const { motorcycles, weights, pillionMode } = get();

        if (motorcycles.length === 0) {
          set({ error: "No motorcycles to compare" });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Score and rank motorcycles using deterministic engine
          const scoredMotorcycles = scoreAndRankMotorcycles(
            motorcycles,
            weights,
            pillionMode
          );

          // Generate explanations using reasoning agent
          const comparison = await generateComparisonResult(scoredMotorcycles, weights);

          set({
            scoredMotorcycles,
            comparison,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Comparison failed",
          });
        }
      },

      // ==================
      // RESET
      // ==================

      reset: () => {
        set({ ...initialState });
      },
    }),
    {
      name: "motologix-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences, not transient state
      partialize: (state) => ({
        weights: state.weights,
        pillionMode: state.pillionMode,
        parentModeEnabled: state.parentModeEnabled,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

/**
 * Get the top-ranked motorcycle
 */
export function useTopMotorcycle() {
  return useAppStore((state) =>
    state.scoredMotorcycles.length > 0 ? state.scoredMotorcycles[0] : null
  );
}

/**
 * Check if comparison is ready
 */
export function useIsComparisonReady() {
  return useAppStore(
    (state) => state.scoredMotorcycles.length > 0 && state.comparison !== null
  );
}

/**
 * Get comparison summary
 */
export function useComparisonSummary() {
  return useAppStore((state) => ({
    totalBikes: state.motorcycles.length,
    queriedBikes: state.bikeQueries.length,
    hasResults: state.scoredMotorcycles.length > 0,
    isLoading: state.isLoading,
    isDiscovering: state.isDiscovering,
    error: state.error,
  }));
}
