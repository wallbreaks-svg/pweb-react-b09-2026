import { useState } from "react";
import "./App.css";
import {
  ApplicationForm,
  JobExplorer,
  PlaceholderTab,
  SkillProfile,
} from "./components/index.ts";
import { useLocalStorage } from "./hooks/useLocalStorage.ts";
import type { Application } from "./types/index.ts";
import { WarRoom } from "./components/WarRoom.tsx";

type ActiveTab = "explore" | "manual" | "warroom" | "dashboard";

export function App() {
  // STATE UTAMA: Disimpan di localStorage dan menjadi fondasi untuk modul teman-teman
  const [applications, setApplications] = useLocalStorage<Application[]>(
    "applications",
    []
  );

  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(
    "kaptenSkills",
    ["React", "TypeScript", "CSS"]
  );

  // Tab aktif pada navigasi utama
  const [activeTab, setActiveTab] = useState<ActiveTab>("explore");

  /**
- Menambahkan lamaran baru ke dalam state secara immutable.
- Entri baru diletakkan di paling depan daftar.
   */
  const addApplication = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  /**
- Memperbarui aplikasi dengan id tertentu secara immutable menggunakan updater function.
- Kontrak fungsi ini disiapkan untuk modul War Room / Pipeline teman tim.
   */
  const updateApplication = (
    id: string,
    updater: (app: Application) => Application
  ) => {
    setApplications((prev) =>
      prev.map((item) => (item.id === id ? updater(item) : item))
    );
  };

  // [Bagian 2] Menghapus lamaran dari state secara immutable (dipicu oleh fitur Undo Delete)
  const deleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((item) => item.id !== id));
  };

  // [Bagian 2] Mengembalikan objek lamaran utuh ke state jika tombol Undo diklik dalam < 5 detik
  const restoreApplication = (restoredApp: Application) => {
    setApplications((prev) => {
      if (prev.some((item) => item.id === restoredApp.id)) return prev;
      return [restoredApp, ...prev];
    });
  };

  /**
- Handler penambahan skill Kapten secara immutable.
   */
  const handleAddSkill = (newSkill: string) => {
    setKaptenSkills((prev) => [...prev, newSkill]);
  };

  /**
- Handler penghapusan skill Kapten secara immutable.
   */
  const handleRemoveSkill = (skillToRemove: string) => {
    setKaptenSkills((prev) =>
      prev.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase())
    );
  };

  // Derived state untuk statistik ringkas di header
  const wishlistCount = applications.filter((a) => a.status === "WISHLIST").length;
  const appliedCount = applications.filter((a) => a.status !== "WISHLIST").length;

  return (
    <div className="app-container">
      {/* Header Aplikasi */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-group">
            <h1 className="brand-title">🚀 Aku Mw Magang</h1>
            <span className="brand-subtitle">
              Portal Manajemen & Eksplorasi Lamaran Magang Kapten
            </span>
          </div>

          <div className="header-stats">
            <div className="stat-pill">
              <span className="stat-pill-label">Wishlist</span>
              <span className="stat-pill-value">{wishlistCount}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-label">Dilamar</span>
              <span className="stat-pill-value">{appliedCount}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-label">Skill</span>
              <span className="stat-pill-value">{kaptenSkills.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigasi Utama */}
        <nav className="tab-navigation" aria-label="Navigasi Utama">
          <button
            type="button"
            className={`tab-btn ${activeTab === "explore" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            🔍 Eksplorasi Lowongan
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "manual" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("manual")}
          >
            ✍️ Tambah Lamaran Manual
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "warroom" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("warroom")}
          >
            🛡️ War Room (Pipeline)
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "dashboard" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard & Offer
          </button>
        </nav>
      </header>

      {/* Konten Utama Sesuai Tab Aktif */}
      <main className="main-content">
        {activeTab === "explore" && (
          <div className="tab-pane">
            <SkillProfile
              skills={kaptenSkills}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
            />
            <JobExplorer
              kaptenSkills={kaptenSkills}
              applications={applications}
              onSaveToWishlist={addApplication}
            />
          </div>
        )}

        {activeTab === "manual" && (
          <div className="tab-pane">
            <ApplicationForm
              applications={applications}
              onAddApplication={addApplication}
            />
          </div>
        )}

        {activeTab === "warroom" && (
          <div className="tab-pane">
            {/* [Bagian 2] War Room Pipeline, Ghosting, Bentrok Jadwal, Detail Modal & Undo Delete */}
            <WarRoom
              applications={applications}
              kaptenSkills={kaptenSkills}
              onUpdateApplication={(updatedApp) =>
                updateApplication(updatedApp.id, () => updatedApp)
              }
              onDeleteApplication={deleteApplication}
              onRestoreApplication={restoreApplication}
            />
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="tab-pane">
            <PlaceholderTab
              title="Dashboard Metrik & Komparator Tawaran"
              author="Teman Tim (Bagian 3)"
              description="Analisis performa pencarian magang, rasio konversi per tahap, serta perbandingan detail kompensasi dan tunjangan offer."
              features={[
                "Statistik tingkat kelulusan dari Applied ke Interview",
                "Visualisasi distribusi status lamaran",
                "Offer Comparator: perbandingan gaji, mode kerja, dan benefit",
                "Export ringkasan lamaran ke format JSON",
              ]}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          <strong>Aku Mw Magang</strong> &bull; Bagian 1: Fondasi, Tipe, Skill Match, Eksplorasi Lowongan, & Form Manual.
        </p>
      </footer>
    </div>
  );
}

export default App;