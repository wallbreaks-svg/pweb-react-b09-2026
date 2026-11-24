import type { Application, JobListing, WorkMode } from "../types/index.ts";
import { createApplication, isDuplicate } from "../utils/application.ts";
import { calcSkillMatch, getMatchColor } from "../utils/skillMatch.ts";

interface JobCardProps {
  job: JobListing;
  kaptenSkills: string[];
  applications: Application[];
  onSaveToWishlist: (app: Application) => void;
}

/**
 * Menentukan WorkMode dari teks lokasi.
 * Jika mengandung 'remote' -> Remote, jika mengandung 'hybrid' -> Hybrid, sisanya Onsite.
 */
function deriveWorkMode(locationText: string): WorkMode {
  const lower = locationText.toLowerCase();
  if (lower.includes("remote")) return "Remote";
  if (lower.includes("hybrid")) return "Hybrid";
  return "Onsite";
}

/**
 * Komponen kartu lowongan kerja individual.
 * Match score dan status duplikasi dihitung murni sebagai derived state.
 */
export function JobCard({
  job,
  kaptenSkills,
  applications,
  onSaveToWishlist,
}: JobCardProps) {
  // DERIVED STATE: Dihitung langsung saat render tanpa useState terpisah
  const { score, matched, missing } = calcSkillMatch(kaptenSkills, job.tags);
  const matchColor = getMatchColor(score);

  // DERIVED STATE: Cek apakah lowongan ini sudah pernah disimpan / dilamar
  const alreadyApplied = isDuplicate(applications, job.company_name, job.title);

  const handleSave = () => {
    if (alreadyApplied) return;

    const workMode = deriveWorkMode(job.candidate_required_location);
    const newApp = createApplication({
      company: job.company_name,
      role: job.title,
      workMode,
      status: "WISHLIST",
      requiredSkills: job.tags,
    });

    onSaveToWishlist(newApp);
  };

  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="job-card-heading">
          <span className="job-category-tag">{job.category}</span>
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company_name}</p>
        </div>

        {/* Badge Match Score dengan warna dinamis sesuai persentase kecocokan */}
        <div
          className={`match-score-badge match-score-${matchColor}`}
          title={`Kecocokan ${score}% berdasarkan skill Kapten`}
        >
          <span className="match-score-number">{score}%</span>
          <span className="match-score-label">Match</span>
        </div>
      </div>

      <div className="job-meta-list">
        <span className="job-meta-item">
          📍 {job.candidate_required_location || "Remote"}
        </span>
        {job.salary && (
          <span className="job-meta-item">
            💰 {job.salary}
          </span>
        )}
      </div>

      {/* Rincian Skill: Matched vs Missing */}
      <div className="job-skills-section">
        <div className="job-skills-group">
          <span className="skills-group-label">Skill Cocok ({matched.length}):</span>
          <div className="skills-badge-wrap">
            {matched.length > 0 ? (
              matched.map((skill) => (
                <span key={skill} className="skill-pill skill-pill-matched">
                  ✓ {skill}
                </span>
              ))
            ) : (
              <span className="skills-none-text">Belum ada skill yang cocok</span>
            )}
          </div>
        </div>

        {missing.length > 0 && (
          <div className="job-skills-group">
            <span className="skills-group-label">Skill Belum Dikuasai ({missing.length}):</span>
            <div className="skills-badge-wrap">
              {missing.map((skill) => (
                <span key={skill} className="skill-pill skill-pill-missing">
                  ✕ {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tombol aksi: Simpan ke Wishlist atau label Sudah Dilamar */}
      <div className="job-card-footer">
        <button
          type="button"
          onClick={handleSave}
          disabled={alreadyApplied}
          className={`btn ${alreadyApplied ? "btn-disabled" : "btn-primary"}`}
        >
          {alreadyApplied ? "✓ Sudah Dilamar" : "⭐ Simpan ke Wishlist"}
        </button>
      </div>
    </article>
  );
}
