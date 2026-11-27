import type { Application, WorkMode } from "../types/index.ts";
import { calcSkillMatch } from "./skillMatch.ts";

export const WORK_MODE_SCORE: Record<WorkMode, number> = {
  Remote: 100,
  Hybrid: 75,
  Onsite: 50,
};

export interface OfferScore {
  salary: number;
  salaryNormalized: number;
  workModeScore: number;
  skillMatch: number;
  total: number;
}

/**
 * Skor offer = (Normalisasi Gaji x 50%) + (Skor Mode Kerja x 25%) + (Skill Match % x 25%).
 * Normalisasi gaji = gaji / gaji tertinggi di antara offer yang dibandingkan x 100.
 */
export function calcOfferScore(
  app: Application,
  maxSalary: number,
  kaptenSkills: string[]
): OfferScore {
  const salary = app.salaryOffer ?? 0;
  const salaryNormalized = maxSalary > 0 ? (salary / maxSalary) * 100 : 0;
  const workModeScore = WORK_MODE_SCORE[app.workMode];
  const skillMatch = calcSkillMatch(kaptenSkills, app.requiredSkills).score;
  const total = salaryNormalized * 0.5 + workModeScore * 0.25 + skillMatch * 0.25;
  return { salary, salaryNormalized, workModeScore, skillMatch, total };
}

export function compareOffers(
  a: Application,
  b: Application,
  kaptenSkills: string[]
): { a: OfferScore; b: OfferScore; winner: "A" | "B" | "SERI" } {
  const maxSalary = Math.max(a.salaryOffer ?? 0, b.salaryOffer ?? 0);
  const sa = calcOfferScore(a, maxSalary, kaptenSkills);
  const sb = calcOfferScore(b, maxSalary, kaptenSkills);
  const diff = sa.total - sb.total;
  return {
    a: sa,
    b: sb,
    winner: Math.abs(diff) < 0.005 ? "SERI" : diff > 0 ? "A" : "B",
  };
}