interface PlaceholderTabProps {
  title: string;
  author: string;
  description: string;
  features: string[];
}

/**
 * Komponen placeholder untuk fitur yang akan dikerjakan anggota tim lain (Bagian 2 & Bagian 3).
 */
export function PlaceholderTab({
  title,
  author,
  description,
  features,
}: PlaceholderTabProps) {
  return (
    <div className="placeholder-container">
      <div className="placeholder-badge">Modul Berikutnya</div>
      <h2 className="placeholder-title">{title}</h2>
      <p className="placeholder-author">Penanggung Jawab: <strong>{author}</strong></p>
      <p className="placeholder-desc">{description}</p>

      <div className="placeholder-feature-box">
        <h3 className="placeholder-feature-title">Fitur yang sedang dipersiapkan:</h3>
        <ul className="placeholder-feature-list">
          {features.map((feature) => (
            <li key={feature} className="placeholder-feature-item">
              ⏳ {feature}
            </li>
          ))}
        </ul>
      </div>
      <p className="placeholder-note">
        💡 Fondasi data, tipe TypeScript, dan utilitas state machine telah siap digunakan untuk modul ini.
      </p>
    </div>
  );
}
