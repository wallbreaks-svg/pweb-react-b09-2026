import type { Application } from "../types/index.ts";

/**
 * Menentukan apakah sebuah lamaran berisiko ghosting:
 * Status adalah APPLIED atau SCREENING, dan lastUpdatedAt sudah lebih dari 14 hari yang lalu.
 */
export function isGhostingRisk(app: Application, now: Date = new Date()): boolean {
  if (app.status !== "APPLIED" && app.status !== "SCREENING") {
    return false;
  }

  const lastUpdate = new Date(app.lastUpdatedAt);
  if (Number.isNaN(lastUpdate.getTime())) {
    return false;
  }

  const diffMs = now.getTime() - lastUpdate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays > 14;
}
