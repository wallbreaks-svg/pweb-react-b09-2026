import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useDebounce } from "../hooks/useDebounce.ts";
import type {
  ActivityLog,
  Application,
  ApplicationStatus,
} from "../types/index.ts";
import { isGhostingRisk } from "../utils/ghosting.ts";
import { calcSkillMatch, getMatchColor } from "../utils/skillMatch.ts";
import { ApplicationDetailModal } from "./ApplicationDetailModal.tsx";
import { ConflictBanner } from "./ConflictBanner.tsx";
import { UndoToast } from "./UndoToast.tsx";

interface WarRoomProps {
  applications: Application[];
  kaptenSkills: string[];
  onUpdateApplication: (updatedApp: Application) => void;
  onDeleteApplication: (id: string) => void;
  onRestoreApplication: (app: Application) => void;
  renderInterviewPrep?: (app: Application) => ReactNode;
}

type StatusFilter = "ALL" | ApplicationStatus;
type WarRoomSort = "newest" | "nearest_interview" | "highest_offer";

const ALL_STATUSES: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

export function WarRoom({
  applications,
  kaptenSkills,
  onUpdateApplication,
  onDeleteApplication,
  onRestoreApplication,
  renderInterviewPrep,
}: WarRoomProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [onlyGhostingRisk, setOnlyGhostingRisk] = useState(false);
  const [sortBy, setSortBy] = useState<WarRoomSort>("newest");

  // Menyimpan ID lamaran yang sedang dibuka di modal agar selalu sinkron dengan state utama
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // State & useRef untuk Fitur 6: Undo Delete (5 Detik)
  const [deletedToastApp, setDeletedToastApp] = useState<Application | null>(null);
  // useRef menyimpan ID timer tanpa memicu re-render dan dibersihkan jika hapus 2x berturut-turut
  const deleteTimerRef = useRef<number | null>(null);

  const debouncedSearch = useDebounce(searchKeyword, 400);

  // Cleanup timer Undo Delete saat komponen unmount
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) {
        window.clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  const selectedApplication = useMemo(
    () => applications.find((app) => app.id === selectedAppId) ?? null,
    [applications, selectedAppId]
  );

  // DERIVED STATE: Filter gabungan & Sorting tanpa mutasi array asli
  const filteredAndSortedApps = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    const filtered = applications.filter((app) => {
      if (statusFilter !== "ALL" && app.status !== statusFilter) {
        return false;
      }

      if (onlyGhostingRisk && !isGhostingRisk(app)) {
        return false;
      }

      if (query) {
        const matchCompany = app.company.toLowerCase().includes(query);
        const matchRole = app.role.toLowerCase().includes(query);
        const matchSkill = app.requiredSkills.some((s) =>
          s.toLowerCase().includes(query)
        );
        if (!matchCompany && !matchRole && !matchSkill) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "nearest_interview") {
        const timeA = a.interviewDateTime
          ? new Date(a.interviewDateTime).getTime()
          : Number.POSITIVE_INFINITY;
        const timeB = b.interviewDateTime
          ? new Date(b.interviewDateTime).getTime()
          : Number.POSITIVE_INFINITY;
        return timeA - timeB;
      }

      if (sortBy === "highest_offer") {
        const offerA = a.salaryOffer ?? -1;
        const offerB = b.salaryOffer ?? -1;
        return offerB - offerA;
      }

      return (
        new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
      );
    });
  }, [applications, debouncedSearch, statusFilter, onlyGhostingRisk, sortBy]);

  // Simulasi +15 Hari untuk menguji deteksi Rawan Ghosting (> 14 hari)
  const handleSimulate15Days = (app: Application) => {
    if (app.status !== "APPLIED" && app.status !== "SCREENING") return;

    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    const baseTime = new Date(app.lastUpdatedAt).getTime();
    const safeBaseTime = Number.isNaN(baseTime) ? Date.now() : baseTime;
    const pastIso = new Date(safeBaseTime - fifteenDaysMs).toISOString();

    const logEntry: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: "Simulasi waktu: lastUpdatedAt dimundurkan 15 hari (uji Rawan Ghosting)",
    };

    onUpdateApplication({
      ...app,
      lastUpdatedAt: pastIso,
      activityLogs: [logEntry, ...app.activityLogs],
    });
  };

  // Hapus lamaran + timer Undo 5 detik (bersihkan timer lama jika hapus beruntun)
  const handleDeleteWithUndo = (app: Application) => {
    if (deleteTimerRef.current !== null) {
      window.clearTimeout(deleteTimerRef.current);
    }

    if (selectedAppId === app.id) {
      setSelectedAppId(null);
    }

    onDeleteApplication(app.id);
    setDeletedToastApp(app);

    deleteTimerRef.current = window.setTimeout(() => {
      setDeletedToastApp(null);
      deleteTimerRef.current = null;
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!deletedToastApp) return;

    if (deleteTimerRef.current !== null) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }

    onRestoreApplication(deletedToastApp);
    setDeletedToastApp(null);
  };

  const handleDismissToast = () => {
    if (deleteTimerRef.current !== null) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setDeletedToastApp(null);
  };

  return (
    <section className="war-room-section">
      {/* Banner Bentrok Jadwal: selalu mengecek seluruh applications meski filter aktif */}
      <ConflictBanner applications={applications} />

      {/* Kontrol Filter Gabungan & Sorting */}
      <div className="filter-controls-card">
        <div className="filter-input-group search-flex">
          <label htmlFor="warroom-search" className="filter-label">
            Cari Lamaran:
          </label>
          <input
            id="warroom-search"
            type="search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Cari perusahaan, posisi, atau skill..."
            className="filter-input"
          />
        </div>

        <div className="filter-input-group">
          <label htmlFor="warroom-status-filter" className="filter-label">
            Filter Status:
          </label>
          <select
            id="warroom-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="filter-select"
          >
            <option value="ALL">Semua Status ({applications.length})</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-input-group">
          <label htmlFor="warroom-sort" className="filter-label">
            Urutkan:
          </label>
          <select
            id="warroom-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as WarRoomSort)}
            className="filter-select"
          >
            <option value="newest">Terbaru Diupdate</option>
            <option value="nearest_interview">Jadwal Interview Terdekat</option>
            <option value="highest_offer">Offer Tertinggi</option>
          </select>
        </div>

        <div className="filter-input-group ghosting-toggle-group">
          <label className="checkbox-toggle-label">
            <input
              type="checkbox"
              checked={onlyGhostingRisk}
              onChange={(e) => setOnlyGhostingRisk(e.target.checked)}
            />
            <span>👻 Hanya Rawan Ghosting (&gt;14 hari)</span>
          </label>
        </div>
      </div>

      {/* Daftar Kartu Pipeline Lamaran */}
      {filteredAndSortedApps.length === 0 ? (
        <div className="status-container empty-card">
          <div className="empty-icon">📂</div>
          <h3 className="empty-title">Belum Ada Lamaran yang Ditampilkan</h3>
          <p className="empty-desc">
            {applications.length === 0
              ? "Simpan lowongan dari tab Eksplorasi atau tambahkan lewat Form Manual."
              : "Tidak ada lamaran yang sesuai dengan kombinasi filter saat ini."}
          </p>
        </div>
      ) : (
        <div className="war-room-grid">
          {filteredAndSortedApps.map((app) => {
            const { score } = calcSkillMatch(kaptenSkills, app.requiredSkills);
            const matchColor = getMatchColor(score);
            const ghosting = isGhostingRisk(app);
            const doneChecklist = app.checklist.filter((c) => c.done).length;
            const totalChecklist = app.checklist.length;
            const canSimulateGhosting =
              app.status === "APPLIED" || app.status === "SCREENING";

            return (
              <article key={app.id} className="job-card application-card">
                <div className="job-card-top">
                  <div className="job-card-heading">
                    <div className="badge-row">
                      <span
                        className={`status-pill status-${app.status.toLowerCase()}`}
                      >
                        {app.status}
                      </span>
                      <span className="job-category-tag">{app.workMode}</span>
                      {ghosting && (
                        <span className="ghosting-badge" title="Tidak ada update > 14 hari">
                          👻 Rawan Ghosting
                        </span>
                      )}
                    </div>
                    <h3 className="job-title">{app.role}</h3>
                    <p className="job-company">{app.company}</p>
                  </div>

                  <div className={`match-score-badge match-score-${matchColor}`}>
                    <span className="match-score-number">{score}%</span>
                    <span className="match-score-label">Match</span>
                  </div>
                </div>

                <div className="job-meta-list">
                  <span className="job-meta-item">
                    📄 CV: <strong>{app.cvVersion || "-"}</strong>
                  </span>
                  <span className="job-meta-item">
                    ✅ Checklist:{" "}
                    <strong>
                      {doneChecklist}/{totalChecklist}
                    </strong>
                  </span>
                  {app.interviewDateTime && (
                    <span className="job-meta-item">
                      🗓️ Interview:{" "}
                      <strong>
                        {new Date(app.interviewDateTime).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                  )}
                  {typeof app.salaryOffer === "number" && app.salaryOffer > 0 && (
                    <span className="job-meta-item">
                      💰 Offer:{" "}
                      <strong>Rp {app.salaryOffer.toLocaleString("id-ID")}</strong>
                    </span>
                  )}
                </div>

                <div className="job-card-footer war-room-card-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    🔍 Detail & Kelola
                  </button>

                  {canSimulateGhosting && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleSimulate15Days(app)}
                      title="Mundurkan lastUpdatedAt 15 hari untuk uji Rawan Ghosting"
                    >
                      ⏩ Simulasi +15 Hari
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleDeleteWithUndo(app)}
                    title="Hapus lamaran (bisa Undo 5 detik)"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Detail Lamaran (Fitur 4 + Slot Fitur 5) */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          kaptenSkills={kaptenSkills}
          onClose={() => setSelectedAppId(null)}
          onUpdateApplication={onUpdateApplication}
          renderInterviewPrep={renderInterviewPrep}
        />
      )}

      {/* Toast Undo Delete 5 Detik (Fitur 6) */}
      <UndoToast
        deletedApp={deletedToastApp}
        onUndo={handleUndoDelete}
        onDismiss={handleDismissToast}
      />
    </section>
  );
}