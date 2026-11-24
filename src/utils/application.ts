import type {
  ActivityLog,
  Application,
  ApplicationStatus,
  ChecklistItem,
  WorkMode,
} from "../types/index.ts";

export interface CreateApplicationInput {
  company: string;
  role: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
  checklist?: ChecklistItem[];
  activityLogs?: ActivityLog[];
}

/**
 * Memeriksa apakah kombinasi company dan role sudah ada di daftar lamaran (case-insensitive + trim).
 */
export function isDuplicate(
  apps: Application[],
  company: string,
  role: string
): boolean {
  const targetCompany = company.trim().toLowerCase();
  const targetRole = role.trim().toLowerCase();

  if (!targetCompany || !targetRole) return false;

  return apps.some(
    (app) =>
      app.company.trim().toLowerCase() === targetCompany &&
      app.role.trim().toLowerCase() === targetRole
  );
}

/**
 * Membuat entri Application baru secara murni dan immutable.
 * id digenerate via crypto.randomUUID(), lastUpdatedAt = waktu ISO saat ini,
 * checklist default kosong, dan activityLogs berisi entri awal "Lamaran dibuat dengan status X".
 */
export function createApplication(input: CreateApplicationInput): Application {
  const now = new Date().toISOString();

  const initialLog: ActivityLog = {
    id: crypto.randomUUID(),
    timestamp: now,
    message: `Lamaran dibuat dengan status ${input.status}`,
  };

  return {
    id: crypto.randomUUID(),
    company: input.company.trim(),
    role: input.role.trim(),
    workMode: input.workMode,
    status: input.status,
    requiredSkills: [...input.requiredSkills],
    cvVersion: input.cvVersion?.trim() || undefined,
    appliedDate: input.appliedDate?.trim() || undefined,
    interviewDateTime: input.interviewDateTime?.trim() || undefined,
    salaryOffer: input.salaryOffer,
    lastUpdatedAt: now,
    checklist: input.checklist ? [...input.checklist] : [],
    activityLogs: input.activityLogs ? [...input.activityLogs] : [initialLog],
  };
}

/**
 * Melakukan parsing teks berisi daftar skill yang dipisahkan koma.
 * Menghapus spasi, membuang entri kosong, dan membuang duplikat (case-insensitive).
 */
export function parseSkills(text: string): string[] {
  const parts = text.split(",");
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }

  return result;
}

/**
 * Melakukan parsing teks gaji (misal "Rp 4.500.000" atau "4500000") menjadi angka murni.
 * Mengembalikan number atau undefined jika tidak ada angka yang valid.
 */
export function parseSalary(salary: string): number | undefined {
  if (!salary || typeof salary !== "string") return undefined;
  const cleaned = salary.replace(/[^0-9]/g, "");
  if (!cleaned) return undefined;
  const num = parseInt(cleaned, 10);
  return Number.isNaN(num) ? undefined : num;
}
