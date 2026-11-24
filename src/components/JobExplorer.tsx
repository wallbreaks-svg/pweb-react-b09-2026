import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "../hooks/useDebounce.ts";
import { fetchFallbackJobs, fetchRemotiveJobs } from "../services/jobService.ts";
import type { Application, JobListing } from "../types/index.ts";
import { calcSkillMatch } from "../utils/skillMatch.ts";
import { JobCard } from "./JobCard.tsx";

interface JobExplorerProps {
  kaptenSkills: string[];
  applications: Application[];
  onSaveToWishlist: (app: Application) => void;
}

type DataSource = "remotive" | "fallback";
type FetchStatus = "loading" | "success" | "error";
type SortOption = "default" | "highest_match";

/**
 * Komponen Eksplorasi Lowongan Kerja Magang.
 * Menggabungkan live fetch / fallback, search debounce, filter kategori, dan sorting match score.
 */
export function JobExplorer({
  kaptenSkills,
  applications,
  onSaveToWishlist,
}: JobExplorerProps) {
  const [dataSource, setDataSource] = useState<DataSource>("remotive");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Form filter & search
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("default");

  // Feedback singkat setelah menyimpan lowongan
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Debounce search input dengan delay 400ms sesuai spesifikasi
  const debouncedKeyword = useDebounce(searchKeyword, 400);

  // Effect untuk mengambil data lowongan dengan AbortController
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const fetcher =
          dataSource === "remotive" ? fetchRemotiveJobs : fetchFallbackJobs;
        const data = await fetcher(controller.signal);
        setJobs(data);
        setFetchStatus("success");
      } catch (err: unknown) {
        // Abaikan AbortError karena terjadi saat komponen unmount atau re-fetch disengaja
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        const msg =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat data lowongan.";
        setErrorMessage(msg);
        setFetchStatus("error");
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [dataSource, retryTrigger]);

  // DERIVED STATE: Daftar kategori unik dari data lowongan yang berhasil di-load
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    for (const job of jobs) {
      if (job.category) {
        categories.add(job.category);
      }
    }
    return Array.from(categories).sort();
  }, [jobs]);

  // DERIVED STATE: Filter dan Sorting data lowongan secara real-time
  const filteredAndSortedJobs = useMemo(() => {
    const query = debouncedKeyword.trim().toLowerCase();

    // 1. Filter kata kunci & kategori
    const filtered = jobs.filter((job) => {
      const matchCategory =
        selectedCategory === "all" || job.category === selectedCategory;

      if (!matchCategory) return false;

      if (!query) return true;

      const titleMatch = job.title.toLowerCase().includes(query);
      const companyMatch = job.company_name.toLowerCase().includes(query);
      const tagMatch = job.tags.some((t) => t.toLowerCase().includes(query));

      return titleMatch || companyMatch || tagMatch;
    });

    // 2. Sorting
    if (sortOption === "highest_match") {
      return [...filtered].sort((a, b) => {
        const scoreA = calcSkillMatch(kaptenSkills, a.tags).score;
        const scoreB = calcSkillMatch(kaptenSkills, b.tags).score;
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [jobs, debouncedKeyword, selectedCategory, sortOption, kaptenSkills]);

  const handleWishlistAdd = (app: Application) => {
    onSaveToWishlist(app);
    setFeedbackNotice(`"${app.role}" di ${app.company} berhasil disimpan ke Wishlist!`);
    window.setTimeout(() => setFeedbackNotice(null), 3500);
  };

  return (
    <section className="job-explorer-section">
      {/* Kontrol Sumber Data (Toggle Live API / Fallback Lokal) */}
      <div className="source-toggle-bar">
        <span className="source-label">Sumber Data:</span>
        <div className="btn-group">
          <button
            type="button"
            className={`btn btn-sm ${
              dataSource === "remotive" ? "btn-active" : "btn-outline"
            }`}
            onClick={() => setDataSource("remotive")}
          >
            🌐 Live API (Remotive)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              dataSource === "fallback" ? "btn-active" : "btn-outline"
            }`}
            onClick={() => setDataSource("fallback")}
          >
            💾 Fallback Lokal (magang-fallback.json)
          </button>
        </div>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="filter-controls-card">
        <div className="filter-input-group search-flex">
          <label htmlFor="job-search" className="filter-label">
            Pencarian (Debounced 400ms):
          </label>
          <input
            id="job-search"
            type="search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Cari posisi, perusahaan, atau skill (mis. React, Go, Docker)..."
            className="filter-input"
          />
        </div>

        <div className="filter-input-group">
          <label htmlFor="category-select" className="filter-label">
            Kategori:
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">Semua Kategori ({jobs.length})</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-input-group">
          <label htmlFor="sort-select" className="filter-label">
            Urutan:
          </label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="filter-select"
          >
            <option value="default">Default</option>
            <option value="highest_match">Match Score Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Banner Feedback Simpan Wishlist */}
      {feedbackNotice && (
        <div className="alert-banner alert-success" role="alert">
          <span>{feedbackNotice}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setFeedbackNotice(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Status: LOADING */}
      {fetchStatus === "loading" && (
        <div className="status-container">
          <div className="loading-spinner" aria-hidden="true" />
          <p className="loading-text">
            Sedang mengambil daftar lowongan dari{" "}
            {dataSource === "remotive" ? "Remotive API..." : "Data Fallback Lokal..."}
          </p>
        </div>
      )}

      {/* Status: ERROR */}
      {fetchStatus === "error" && (
        <div className="status-container error-card" role="alert">
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">Gagal Memuat Data Lowongan</h3>
          <p className="error-message">{errorMessage}</p>
          <div className="error-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setRetryTrigger((c) => c + 1)}
            >
              🔄 Coba Lagi
            </button>
            {dataSource === "remotive" && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDataSource("fallback")}
              >
                💾 Pakai Data Lokal / Fallback
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status: SUCCESS */}
      {fetchStatus === "success" && (
        <>
          <div className="results-header">
            <p className="results-count">
              Menampilkan <strong>{filteredAndSortedJobs.length}</strong> dari{" "}
              {jobs.length} lowongan
              {selectedCategory !== "all" && ` dalam kategori "${selectedCategory}"`}
              {debouncedKeyword && ` untuk "${debouncedKeyword}"`}
            </p>
          </div>

          {filteredAndSortedJobs.length === 0 ? (
            <div className="status-container empty-card">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">Tidak Ada Lowongan yang Cocok</h3>
              <p className="empty-desc">
                Coba sesuaikan kata kunci pencarian atau ubah filter kategori.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearchKeyword("");
                  setSelectedCategory("all");
                }}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="job-cards-grid">
              {filteredAndSortedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  kaptenSkills={kaptenSkills}
                  applications={applications}
                  onSaveToWishlist={handleWishlistAdd}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
