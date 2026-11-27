import type { Application } from "../types/index.ts";
import { isGhostingRisk } from "./ghosting.ts";

export interface DashboardStats {
  total: number;
  responseRate: number;
  interviewRate: number;
  ghostingRisk: number;
  totalOffer: number;
}

const RESPONDED: Application["status"][] = ["SCREENING", "INTERVIEW", "OFFER", "REJECTED"];
const REACHED_INTERVIEW: Application["status"][] = ["INTERVIEW", "OFFER"];

function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/**
 * Statistik dashboard (fungsi murni, dipanggil langsung saat render = derived state).
 * Basis rate = lamaran yang sudah benar-benar dikirim (status selain WISHLIST).
 * - Response Rate  : SCREENING / INTERVIEW / OFFER / REJECTED  dibagi basis
 * - Interview Rate : INTERVIEW / OFFER dibagi basis
 */
export function calcDashboardStats(
  apps: Application[],
  now: Date = new Date()
): DashboardStats {
  const sent = apps.filter((a) => a.status !== "WISHLIST");
  return {
    total: apps.length,
    responseRate: percent(sent.filter((a) => RESPONDED.includes(a.status)).length, sent.length),
    interviewRate: percent(
      sent.filter((a) => REACHED_INTERVIEW.includes(a.status)).length,
      sent.length
    ),
    ghostingRisk: apps.filter((a) => isGhostingRisk(a, now)).length,
    totalOffer: apps.filter((a) => a.status === "OFFER").length,
  };
}