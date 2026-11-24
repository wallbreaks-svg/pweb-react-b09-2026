import type { Application } from "../types/index.ts";

/**
 * Mencari konflik jadwal interview antar lamaran.
 * Mengembalikan pasangan [Application, Application] yang sama-sama berstatus INTERVIEW
 * dan memiliki selisih jadwal interviewDateTime kurang dari 60 menit.
 */
export function findInterviewConflicts(
  apps: Application[]
): Array<[Application, Application]> {
  const conflicts: Array<[Application, Application]> = [];

  // Filter lamaran dengan status INTERVIEW dan memiliki interviewDateTime valid
  const interviewApps = apps.filter(
    (app) =>
      app.status === "INTERVIEW" &&
      typeof app.interviewDateTime === "string" &&
      app.interviewDateTime.trim().length > 0 &&
      !Number.isNaN(new Date(app.interviewDateTime).getTime())
  );

  for (let i = 0; i < interviewApps.length; i++) {
    const appA = interviewApps[i];
    if (!appA || !appA.interviewDateTime) continue;
    const timeA = new Date(appA.interviewDateTime).getTime();

    for (let j = i + 1; j < interviewApps.length; j++) {
      const appB = interviewApps[j];
      if (!appB || !appB.interviewDateTime) continue;
      const timeB = new Date(appB.interviewDateTime).getTime();

      const diffMs = Math.abs(timeA - timeB);
      const diffMinutes = diffMs / (1000 * 60);

      if (diffMinutes < 60) {
        conflicts.push([appA, appB]);
      }
    }
  }

  return conflicts;
}
