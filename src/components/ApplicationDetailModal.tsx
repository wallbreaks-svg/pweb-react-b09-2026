import { useState, type FormEvent, type ReactNode } from "react";
import type {
  ActivityLog,
  Application,
  ApplicationStatus,
  ChecklistItem,
  WorkMode,
} from "../types/index.ts";
import { parseSalary } from "../utils/application.ts";
import { calcSkillMatch, getMatchColor } from "../utils/skillMatch.ts";
import {
  getAllowedTransitions,
  validateTransition,
} from "../utils/stateMachine.ts";

interface ApplicationDetailModalProps {
  application: Application;
  kaptenSkills: string[];
  onClose: () => void;
  onUpdateApplication: (updatedApp: Application) => void;
  // Slot opsional agar Teman 3 dapat menyisipkan InterviewPrepTimer (Fitur 5) dengan mudah
  renderInterviewPrep?: (app: Application) => ReactNode;
}

type DetailTab = "overview" | "interview_prep";

export function ApplicationDetailModal({
  application,
  kaptenSkills,
  onClose,
  onUpdateApplication,
  renderInterviewPrep,
}: ApplicationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  // State form transisi status (State Machine)
  const allowedNextStatuses = getAllowedTransitions(application.status);
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus | "">(
    allowedNextStatuses[0] ?? ""
  );
  const [cvVersion, setCvVersion] = useState(application.cvVersion ?? "");
  const [appliedDate, setAppliedDate] = useState(
    application.appliedDate ?? new Date().toISOString().slice(0, 10)
  );
  const [interviewDateTime, setInterviewDateTime] = useState(
    application.interviewDateTime ?? ""
  );
  const [salaryInput, setSalaryInput] = useState(
    application.salaryOffer ? String(application.salaryOffer) : ""
  );
  const [workMode, setWorkMode] = useState<WorkMode>(application.workMode);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // State form tambah checklist & catatan log manual
  const [newChecklistText, setNewChecklistText] = useState("");
  const [manualNote, setManualNote] = useState("");

  // DERIVED STATE: Dihitung langsung dari props tanpa useState tambahan
  const { score, matched, missing } = calcSkillMatch(
    kaptenSkills,
    application.requiredSkills
  );
  const matchColor = getMatchColor(score);
  const completedCount = application.checklist.filter((item) => item.done).length;
  const totalChecklist = application.checklist.length;
  const checklistPercent =
    totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;

  // 1. Transisi Status State Machine + Validasi Input Kondisional
  const handleStatusTransition = (e: FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    const parsedSalary = parseSalary(salaryInput);
    const payload: Partial<Application> = {
      cvVersion: targetStatus === "APPLIED" ? cvVersion.trim() : application.cvVersion,
      appliedDate:
        targetStatus === "APPLIED" ? appliedDate.trim() : application.appliedDate,
      interviewDateTime:
        targetStatus === "INTERVIEW"
          ? interviewDateTime.trim()
          : application.interviewDateTime,
      salaryOffer: targetStatus === "OFFER" ? parsedSalary : application.salaryOffer,
      workMode: targetStatus === "OFFER" ? workMode : application.workMode,
    };

    const errorMsg = validateTransition(application, targetStatus, payload);
    if (errorMsg) {
      setTransitionError(errorMsg);
      return;
    }

    const now = new Date().toISOString();
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: now,
      message: `Status berubah dari ${application.status} ke ${targetStatus}`,
    };

    // Update immutable ke parent (Lifting State Up)
    const updatedApp: Application = {
      ...application,
      ...payload,
      status: targetStatus,
      lastUpdatedAt: now,
      activityLogs: [newLog, ...application.activityLogs],
    };

    setTransitionError(null);
    onUpdateApplication(updatedApp);

    const nextOptions = getAllowedTransitions(targetStatus);
    setTargetStatus(nextOptions[0] ?? "");
  };

  // 2. Nested Checklist CRUD (100% Immutable: memakai spread, .map(), dan .filter())
  const handleAddChecklist = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
    };

    onUpdateApplication({
      ...application,
      checklist: [...application.checklist, newItem],
    });
    setNewChecklistText("");
  };

  const handleToggleChecklist = (itemId: string) => {
    onUpdateApplication({
      ...application,
      checklist: application.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
    });
  };

  const handleDeleteChecklist = (itemId: string) => {
    onUpdateApplication({
      ...application,
      checklist: application.checklist.filter((item) => item.id !== itemId),
    });
  };

  // 3. Tambah Catatan Manual ke Activity Log
  const handleAddManualLog = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = manualNote.trim();
    if (!trimmed) return;

    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: `Catatan Kapten: ${trimmed}`,
    };

    onUpdateApplication({
      ...application,
      activityLogs: [newLog, ...application.activityLogs],
    });
    setManualNote("");
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-container detail-modal">
        <div className="modal-header">
          <div>
            <span className={`status-pill status-${application.status.toLowerCase()}`}>
              {application.status}
            </span>
            <h2 className="modal-title">
              {application.role} — {application.company}
            </h2>
            <p className="modal-subtitle">
              Mode: <strong>{application.workMode}</strong> • Match Score:{" "}
              <span className={`match-text-${matchColor}`}>
                <strong>{score}%</strong>
              </span>
              {application.cvVersion && ` • CV: ${application.cvVersion}`}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={onClose}
            aria-label="Tutup detail lamaran"
          >
            ✕ Tutup
          </button>
        </div>

        {/* Sub-Navigasi Tab: Detail Lamaran vs Latihan Interview (Fitur 5) */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`btn btn-sm ${
              activeTab === "overview" ? "btn-active" : "btn-outline"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            📋 Pipeline, Checklist & Log
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              activeTab === "interview_prep" ? "btn-active" : "btn-outline"
            }`}
            onClick={() => setActiveTab("interview_prep")}
          >
            ⏱️ Latihan Interview (02:00)
          </button>
        </div>

        {activeTab === "overview" ? (
          <div className="modal-body">
            {/* Ringkasan Skill */}
            <div className="detail-section">
              <h3 className="detail-section-title">Analisis Skill Lowongan</h3>
              <div className="skills-badge-wrap">
                {matched.map((skill) => (
                  <span key={skill} className="skill-pill skill-pill-matched">
                    ✓ {skill}
                  </span>
                ))}
                {missing.map((skill) => (
                  <span key={skill} className="skill-pill skill-pill-missing">
                    ✕ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Transisi Status State Machine */}
            <div className="detail-section">
              <h3 className="detail-section-title">Pindah Tahap (State Machine)</h3>
              {allowedNextStatuses.length === 0 ? (
                <p className="form-help-text">
                  Status <strong>{application.status}</strong> bersifat final dan tidak dapat berpindah tahap lagi.
                </p>
              ) : (
                <form onSubmit={handleStatusTransition} className="transition-form">
                  <div className="form-field-group">
                    <label htmlFor="next-status-select" className="form-label">
                      Pilih Status Tujuan:
                    </label>
                    <select
                      id="next-status-select"
                      value={targetStatus}
                      onChange={(e) => {
                        setTargetStatus(e.target.value as ApplicationStatus);
                        setTransitionError(null);
                      }}
                      className="form-select"
                    >
                      {allowedNextStatuses.map((st) => (
                        <option key={st} value={st}>
                          {application.status} ➔ {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Input Kondisional untuk Status APPLIED */}
                  {targetStatus === "APPLIED" && (
                    <div className="conditional-fields-box">
                      <div className="form-grid">
                        <div className="form-field-group">
                          <label htmlFor="detail-cv" className="form-label">
                            Versi CV *
                          </label>
                          <input
                            id="detail-cv"
                            type="text"
                            value={cvVersion}
                            onChange={(e) => setCvVersion(e.target.value)}
                            placeholder="Misal: CV_Frontend_v2.pdf"
                            className="form-input"
                          />
                        </div>
                        <div className="form-field-group">
                          <label htmlFor="detail-date" className="form-label">
                            Tanggal Melamar *
                          </label>
                          <input
                            id="detail-date"
                            type="date"
                            value={appliedDate}
                            onChange={(e) => setAppliedDate(e.target.value)}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Kondisional untuk Status INTERVIEW */}
                  {targetStatus === "INTERVIEW" && (
                    <div className="conditional-fields-box">
                      <div className="form-field-group">
                        <label htmlFor="detail-interview" className="form-label">
                          Jadwal Tanggal & Waktu Interview *
                        </label>
                        <input
                          id="detail-interview"
                          type="datetime-local"
                          value={interviewDateTime}
                          onChange={(e) => setInterviewDateTime(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  )}

                  {/* Input Kondisional untuk Status OFFER */}
                  {targetStatus === "OFFER" && (
                    <div className="conditional-fields-box">
                      <div className="form-grid">
                        <div className="form-field-group">
                          <label htmlFor="detail-salary" className="form-label">
                            Nominal Uang Saku / Gaji (Rp) *
                          </label>
                          <input
                            id="detail-salary"
                            type="number"
                            min={1}
                            value={salaryInput}
                            onChange={(e) => setSalaryInput(e.target.value)}
                            placeholder="Misal: 4500000"
                            className="form-input"
                          />
                        </div>
                        <div className="form-field-group">
                          <label htmlFor="detail-workmode" className="form-label">
                            Mode Kerja Offer *
                          </label>
                          <select
                            id="detail-workmode"
                            value={workMode}
                            onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                            className="form-select"
                          >
                            <option value="Remote">Remote</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="Onsite">Onsite</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {transitionError && (
                    <p className="form-error-text">{transitionError}</p>
                  )}

                  <button type="submit" className="btn btn-primary btn-sm">
                    ✓ Simpan Perubahan Status
                  </button>
                </form>
              )}
            </div>

            {/* Nested Checklist Persiapan */}
            <div className="detail-section">
              <div className="checklist-header">
                <h3 className="detail-section-title">Checklist Persiapan</h3>
                <span className="checklist-progress-label">
                  {completedCount}/{totalChecklist} selesai ({checklistPercent}%)
                </span>
              </div>

              <div className="progress-bar-track" aria-hidden="true">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              <form onSubmit={handleAddChecklist} className="inline-add-form">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Tambah item persiapan (mis. Pelajari arsitektur perusahaan)..."
                  className="form-input"
                />
                <button type="submit" className="btn btn-sm btn-primary">
                  + Tambah
                </button>
              </form>

              {application.checklist.length === 0 ? (
                <p className="empty-text">Belum ada item checklist.</p>
              ) : (
                <ul className="checklist-items">
                  {application.checklist.map((item) => (
                    <li key={item.id} className="checklist-item-row">
                      <label className="checklist-label">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleToggleChecklist(item.id)}
                        />
                        <span className={item.done ? "checklist-done" : ""}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleDeleteChecklist(item.id)}
                        aria-label={`Hapus ${item.text}`}
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Activity Log & Catatan Manual */}
            <div className="detail-section">
              <h3 className="detail-section-title">Activity Log & Catatan Kapten</h3>

              <form onSubmit={handleAddManualLog} className="inline-add-form">
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Tulis catatan manual (mis. Follow up HR via LinkedIn)..."
                  className="form-input"
                />
                <button type="submit" className="btn btn-sm btn-secondary">
                  📝 Catat
                </button>
              </form>

              <ul className="activity-log-list">
                {application.activityLogs.map((log) => (
                  <li key={log.id} className="activity-log-item">
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="log-message">{log.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            {renderInterviewPrep ? (
              renderInterviewPrep(application)
            ) : (
              <div className="placeholder-container">
                <p>
                  ⏳ Modul <strong>Interview Prep Timer (02:00)</strong> akan diisi oleh anggota tim Bagian 3.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}