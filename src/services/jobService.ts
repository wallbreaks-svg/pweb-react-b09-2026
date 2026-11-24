import type { JobListing } from "../types/index.ts";

/**
 * Type guard dan validator untuk mengubah objek mentah menjadi JobListing tanpa 'any'.
 */
function sanitizeJobListing(item: unknown): JobListing | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }

  const record = item as Record<string, unknown>;

  const rawId = record.id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  if (Number.isNaN(id)) {
    return null;
  }

  const title = typeof record.title === "string" ? record.title : "Untitled Role";
  const company_name =
    typeof record.company_name === "string" ? record.company_name : "Perusahaan Anonim";
  const category =
    typeof record.category === "string" ? record.category : "Software Development";
  const candidate_required_location =
    typeof record.candidate_required_location === "string"
      ? record.candidate_required_location
      : "Remote";
  const salary = typeof record.salary === "string" ? record.salary : "";

  // Ambil tags sebagai array of string
  const tags: string[] = Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : [];

  return {
    id,
    title,
    company_name,
    category,
    candidate_required_location,
    salary,
    tags,
  };
}

/**
 * Mengambil lowongan kerja remote dari Remotive API.
 * Menerima AbortSignal untuk pembatalan fetch dan tidak menelan AbortError.
 */
export async function fetchRemotiveJobs(signal: AbortSignal): Promise<JobListing[]> {
  const url = "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Gagal mengambil data dari Remotive (HTTP ${response.status})`);
  }

  const data: unknown = await response.json();

  if (typeof data !== "object" || data === null || !("jobs" in data)) {
    throw new Error("Format respons API Remotive tidak sesuai harapan.");
  }

  const rawJobs = (data as { jobs: unknown }).jobs;
  if (!Array.isArray(rawJobs)) {
    return [];
  }

  const result: JobListing[] = [];
  for (const item of rawJobs) {
    const job = sanitizeJobListing(item);
    if (job) {
      result.push(job);
    }
  }

  return result;
}

/**
 * Mengambil data lowongan magang cadangan dari file lokal /magang-fallback.json.
 * Menerima AbortSignal dan tidak menelan AbortError.
 */
export async function fetchFallbackJobs(signal: AbortSignal): Promise<JobListing[]> {
  const response = await fetch("/magang-fallback.json", { signal });
  if (!response.ok) {
    throw new Error(`Gagal membaca data fallback lokal (HTTP ${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Format data magang-fallback.json bukan array.");
  }

  const result: JobListing[] = [];
  for (const item of data) {
    const job = sanitizeJobListing(item);
    if (job) {
      result.push(job);
    }
  }

  return result;
}
