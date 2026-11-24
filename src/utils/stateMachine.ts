import type { Application, ApplicationStatus } from "../types/index.ts";

// Sesuai testcase 5 + wireframe; sebagian cabang adalah asumsi
export const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ["APPLIED"],
  APPLIED: ["SCREENING", "REJECTED", "GHOSTED"],
  SCREENING: ["INTERVIEW", "REJECTED", "GHOSTED"],
  INTERVIEW: ["OFFER", "REJECTED", "GHOSTED"],
  GHOSTED: ["SCREENING"],
  OFFER: [],
  REJECTED: [],
};

/**
 * Mendapatkan daftar status yang diizinkan untuk transisi dari status saat ini.
 */
export function getAllowedTransitions(from: ApplicationStatus): ApplicationStatus[] {
  return TRANSITIONS[from] ?? [];
}

/**
 * Memeriksa apakah transisi dari status asal ke status tujuan diizinkan.
 */
export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  const allowed = getAllowedTransitions(from);
  return allowed.includes(to);
}

/**
 * Memvalidasi apakah transisi status memenuhi aturan dan prasyarat data.
 * Mengembalikan pesan error (string) jika tidak valid, atau null jika valid.
 */
export function validateTransition(
  app: Application,
  to: ApplicationStatus,
  payload?: Partial<Application>
): string | null {
  if (!canTransition(app.status, to)) {
    return `Transisi dari ${app.status} ke ${to} tidak diizinkan.`;
  }

  // Aturan syarat ke APPLIED: wajib cvVersion & appliedDate
  if (to === "APPLIED") {
    const cv = (payload?.cvVersion ?? app.cvVersion)?.trim();
    const appliedDate = (payload?.appliedDate ?? app.appliedDate)?.trim();
    if (!cv || !appliedDate) {
      return "Status APPLIED membutuhkan versi CV dan tanggal melamar.";
    }
  }

  // Aturan syarat ke INTERVIEW: wajib interviewDateTime
  if (to === "INTERVIEW") {
    const interviewDateTime = (payload?.interviewDateTime ?? app.interviewDateTime)?.trim();
    if (!interviewDateTime) {
      return "Status INTERVIEW membutuhkan jadwal tanggal & waktu interview.";
    }
  }

  // Aturan syarat ke OFFER: wajib salaryOffer > 0 & workMode
  if (to === "OFFER") {
    const salary = payload?.salaryOffer ?? app.salaryOffer;
    const workMode = payload?.workMode ?? app.workMode;
    if (typeof salary !== "number" || salary <= 0 || !workMode) {
      return "Status OFFER membutuhkan penawaran gaji (> 0) dan mode kerja.";
    }
  }

  return null;
}
