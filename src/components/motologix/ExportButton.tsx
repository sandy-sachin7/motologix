"use client";

/**
 * ExportButton Component
 *
 * Generates PDF report of comparison results.
 */

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { FACTOR_METADATA, type FactorKey } from "@/types";

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const scoredMotorcycles = useAppStore((state) => state.scoredMotorcycles);
  const comparison = useAppStore((state) => state.comparison);
  const weights = useAppStore((state) => state.weights);

  const handleExport = async () => {
    if (scoredMotorcycles.length === 0) return;

    setIsExporting(true);

    try {
      // Dynamic import to reduce bundle size
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Title
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Motologix Report", margin, yPos);
      yPos += 10;

      // Tagline
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      doc.text("AI assists. Math decides. Humans approve.", margin, yPos);
      yPos += 5;

      // Date
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
      yPos += 15;

      // Reset color
      doc.setTextColor(0);

      // Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Motorcycles compared: ${scoredMotorcycles.length}`, margin, yPos);
      yPos += 6;

      if (scoredMotorcycles[0]) {
        const winner = scoredMotorcycles[0].motorcycle;
        doc.text(
          `Top recommendation: ${winner.brand} ${winner.model} (Score: ${scoredMotorcycles[0].finalScore}/100)`,
          margin,
          yPos
        );
        yPos += 12;
      }

      // Explanation
      if (comparison?.explanation) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Analysis", margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const explanationLines = doc.splitTextToSize(comparison.explanation, contentWidth);
        doc.text(explanationLines, margin, yPos);
        yPos += explanationLines.length * 5 + 10;
      }

      // Rankings
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Rankings", margin, yPos);
      yPos += 10;

      for (const scoredBike of scoredMotorcycles) {
        const bike = scoredBike.motorcycle;

        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Rank and name
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(
          `#${scoredBike.rank} ${bike.brand} ${bike.model} — ${scoredBike.finalScore}/100`,
          margin,
          yPos
        );
        yPos += 7;

        // Key specs
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${bike.engineCC}cc | ${bike.power} bhp | ${bike.kerbWeight} kg | ABS: ${bike.absType}`,
          margin,
          yPos
        );
        yPos += 6;

        // Factor scores (top 5)
        const sortedFactors = FACTOR_METADATA.map((f) => ({
          label: f.label,
          score: scoredBike.factorScores[f.key as FactorKey],
          weight: weights[f.key],
        })).sort((a, b) => b.score * b.weight - a.score * a.weight);

        doc.setFontSize(8);
        const topFactors = sortedFactors.slice(0, 5);
        const factorText = topFactors
          .map((f) => `${f.label}: ${f.score}/10`)
          .join(" | ");
        doc.text(factorText, margin, yPos);
        yPos += 10;
      }

      // Trade-offs
      if (comparison?.tradeoffs && comparison.tradeoffs.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Trade-offs to Consider", margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        for (const tradeoff of comparison.tradeoffs.slice(0, 5)) {
          const lines = doc.splitTextToSize(`• ${tradeoff}`, contentWidth);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 5 + 2;
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        "Motologix - Powered by deterministic scoring and AI-assisted explanations",
        margin,
        doc.internal.pageSize.getHeight() - 10
      );

      // Save
      const fileName = `motologix-comparison-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (scoredMotorcycles.length === 0) {
    return null;
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <span className="animate-spin mr-2">⚙️</span>
          Generating...
        </>
      ) : (
        <>
          <span className="mr-2">📄</span>
          Export PDF
        </>
      )}
    </Button>
  );
}
