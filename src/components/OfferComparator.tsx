import { useState } from "react";
import type { Application } from "../types/index.ts";
import { compareOffers, type OfferScore } from "../utils/offerScore.ts";

interface OfferComparatorProps {
  applications: Application[];
  kaptenSkills: string[];
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function OfferComparator({ applications, kaptenSkills }: OfferComparatorProps) {
  // Hanya menyimpan id pilihan; data offer selalu diturunkan dari applications terbaru
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");

  const offers = applications.filter((a) => a.status === "OFFER");

  if (offers.length < 2) {
    return (
      <section className="comparator-card">
        <h2 className="detail-section-title">Offer Comparator</h2>
        <p className="empty-text">
          Butuh minimal 2 lamaran berstatus OFFER untuk membandingkan tawaran. Saat ini baru ada{" "}
          {offers.length}.
        </p>
      </section>
    );
  }

  const appA = offers.find((o) => o.id === idA);
  const appB = offers.find((o) => o.id === idB);
  const result = appA && appB && appA.id !== appB.id ? compareOffers(appA, appB, kaptenSkills) : null;

  const renderSelect = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    otherId: string
  ) => (
    <div className="form-field-group">
      <label htmlFor={id} className="form-label">{label}</label>
      <select id={id} className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- Pilih offer --</option>
        {offers.map((o) => (
          <option key={o.id} value={o.id} disabled={o.id === otherId}>
            {o.role} — {o.company}
          </option>
        ))}
      </select>
    </div>
  );

  const column = (app: Application, s: OfferScore, isBest: boolean, tag: string) => (
    <div className={`comparator-col ${isBest ? "comparator-col-best" : ""}`}>
      <h3 className="comparator-col-title">
        {tag}: {app.role}
        <small> {app.company}</small>
      </h3>
      {isBest && <span className="best-badge">🏆 Rekomendasi Terbaik</span>}
      <dl className="comparator-list">
        <dt>Gaji</dt>
        <dd>
          {rupiah(s.salary)} <small>(normalisasi {s.salaryNormalized.toFixed(1)})</small>
        </dd>
        <dt>Mode Kerja</dt>
        <dd>
          {app.workMode} <small>(skor {s.workModeScore})</small>
        </dd>
        <dt>Skill Match</dt>
        <dd>{s.skillMatch}%</dd>
        <dt>Total Skor</dt>
        <dd className="comparator-total">{s.total.toFixed(2)}</dd>
      </dl>
    </div>
  );

  return (
    <section className="comparator-card">
      <h2 className="detail-section-title">Offer Comparator</h2>
      <p className="form-help-text">
        Skor = Gaji ternormalisasi × 50% + Mode Kerja × 25% + Skill Match × 25%
      </p>
      <div className="form-grid">
        {renderSelect("offer-a", "Offer A", idA, setIdA, idB)}
        {renderSelect("offer-b", "Offer B", idB, setIdB, idA)}
      </div>

      {result && appA && appB ? (
        <>
          <div className="comparator-grid">
            {column(appA, result.a, result.winner === "A", "A")}
            {column(appB, result.b, result.winner === "B", "B")}
          </div>
          {result.winner === "SERI" && (
            <p className="form-help-text">Skor kedua offer seri.</p>
          )}
        </>
      ) : (
        <p className="empty-text">Pilih dua offer berbeda untuk melihat perbandingan.</p>
      )}
    </section>
  );
}