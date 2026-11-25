import type { Application } from "../types/index.ts";
import { findInterviewConflicts } from "../utils/conflicts.ts";

interface ConflictBannerProps {
  // Menerima seluruh data applications (bukan hasil filter) agar banner tetap muncul meski filter aktif
  applications: Application[];
}

function formatDateTime(isoOrLocal: string): string {
  const date = new Date(isoOrLocal);
  if (Number.isNaN(date.getTime())) return isoOrLocal;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConflictBanner({ applications }: ConflictBannerProps) {
  // DERIVED STATE: Dihitung langsung dari seluruh lamaran tanpa useState terpisah
  const conflicts = findInterviewConflicts(applications);

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="alert-banner alert-danger conflict-banner" role="alert">
      <div>
        <strong>⚠️ Peringatan Bentrok Jadwal Interview ({conflicts.length} Konflik)!</strong>
        <ul className="conflict-list">
          {conflicts.map(([appA, appB]) => (
            <li key={`${appA.id}-${appB.id}`}>
              <strong>{appA.company}</strong> ({appA.role} —{" "}
              {formatDateTime(appA.interviewDateTime ?? "")}) berselisih &lt; 60 menit dengan{" "}
              <strong>{appB.company}</strong> ({appB.role} —{" "}
              {formatDateTime(appB.interviewDateTime ?? "")})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}