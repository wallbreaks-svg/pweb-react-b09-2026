import { useState, type FormEvent } from "react";

interface SkillProfileProps {
  skills: string[];
  onAddSkill: (newSkill: string) => void;
  onRemoveSkill: (skillToRemove: string) => void;
}

/**
 * Komponen Profil Skill Kapten.
 * Mengelola daftar keahlian utama pengguna, lengkap dengan validasi duplikasi & input kosong.
 */
export function SkillProfile({ skills, onAddSkill, onRemoveSkill }: SkillProfileProps) {
  const [inputSkill, setInputSkill] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputSkill.trim();

    if (!trimmed) {
      setErrorMessage("Nama skill tidak boleh kosong.");
      return;
    }

    // Validasi skill duplikat secara case-insensitive
    const isDuplicate = skills.some(
      (s) => s.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage(`Skill "${trimmed}" sudah ada di profil.`);
      return;
    }

    // Tambahkan skill dan bersihkan input
    onAddSkill(trimmed);
    setInputSkill("");
    setErrorMessage(null);
  };

  return (
    <section className="skill-profile-card">
      <div className="skill-profile-header">
        <div>
          <h2 className="skill-profile-title">Profil Skill Kapten</h2>
          <p className="skill-profile-desc">
            Skill ini dipakai untuk menghitung Match Score lowongan secara real-time.
          </p>
        </div>
        <span className="skill-count-badge">{skills.length} Skill Terdaftar</span>
      </div>

      {/* Form tambah skill baru */}
      <form onSubmit={handleSubmit} className="skill-input-form">
        <div className="skill-input-wrapper">
          <input
            type="text"
            value={inputSkill}
            onChange={(e) => {
              setInputSkill(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Tambah skill baru (mis. Docker, Go, Figma)..."
            className="skill-input"
            aria-label="Tambah skill baru"
          />
          <button type="submit" className="btn btn-primary">
            + Tambah Skill
          </button>
        </div>
        {errorMessage && <p className="form-error-text">{errorMessage}</p>}
      </form>

      {/* Daftar badge skill Kapten */}
      <div className="skill-tags-container">
        {skills.length === 0 ? (
          <p className="empty-text">Belum ada skill. Tambahkan minimal 1 skill.</p>
        ) : (
          skills.map((skill) => (
            <span key={skill} className="skill-badge">
              <span className="skill-badge-text">{skill}</span>
              <button
                type="button"
                onClick={() => onRemoveSkill(skill)}
                className="skill-remove-btn"
                title={`Hapus ${skill}`}
                aria-label={`Hapus ${skill}`}
              >
                &times;
              </button>
            </span>
          ))
        )}
      </div>
    </section>
  );
}
