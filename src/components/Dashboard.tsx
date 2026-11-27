import type { Application } from "../types/index.ts";
import { calcDashboardStats } from "../utils/stats.ts";
import { OfferComparator } from "./OfferComparator.tsx";

interface DashboardProps {
  applications: Application[];
  kaptenSkills: string[];
}

export function Dashboard({ applications, kaptenSkills }: DashboardProps) {
  // DERIVED STATE: semua angka dihitung langsung saat render, tanpa useState terpisah
  const stats = calcDashboardStats(applications);

  const cards: { label: string; value: string; hint: string; tone?: string }[] = [
    { label: "Total Lamaran", value: String(stats.total), hint: "Semua status" },
    {
      label: "Response Rate",
      value: `${stats.responseRate}%`,
      hint: "Screening/Interview/Offer/Rejected dari yang dikirim",
    },
    {
      label: "Interview Rate",
      value: `${stats.interviewRate}%`,
      hint: "Sampai Interview/Offer dari yang dikirim",
    },
    {
      label: "Rawan Ghosting",
      value: String(stats.ghostingRisk),
      hint: "APPLIED/SCREENING > 14 hari",
      tone: stats.ghostingRisk > 0 ? "stat-card-danger" : "",
    },
    { label: "Total Offer", value: String(stats.totalOffer), hint: "Status OFFER", tone: "stat-card-success" },
  ];

  return (
    <div className="dashboard">
      <div className="stat-cards-grid">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card ${c.tone ?? ""}`}>
            <span className="stat-card-label">{c.label}</span>
            <span className="stat-card-value">{c.value}</span>
            <span className="stat-card-hint">{c.hint}</span>
          </div>
        ))}
      </div>

      <OfferComparator applications={applications} kaptenSkills={kaptenSkills} />
    </div>
  );
}