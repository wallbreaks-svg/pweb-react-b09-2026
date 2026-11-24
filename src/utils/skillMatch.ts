/**
 * Menghitung kecocokan skill antara skill Kapten dan skill yang diminta lowongan.
 * Case-insensitive (trim + toLowerCase).
 * Jika requiredSkills kosong, kembalikan score 0.
 */
export function calcSkillMatch(
  kaptenSkills: string[],
  requiredSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 0, matched: [], missing: [] };
  }

  // Set skill Kapten yang dinormalisasi (lowercase + trim)
  const normalizedKapten = new Set(
    kaptenSkills.map((s) => s.trim().toLowerCase()).filter(Boolean)
  );

  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of requiredSkills) {
    const trimmed = skill.trim();
    if (!trimmed) continue;

    if (normalizedKapten.has(trimmed.toLowerCase())) {
      matched.push(trimmed);
    } else {
      missing.push(trimmed);
    }
  }

  const totalRequired = matched.length + missing.length;
  if (totalRequired === 0) {
    return { score: 0, matched: [], missing: [] };
  }

  const score = Math.round((matched.length / totalRequired) * 100);

  return { score, matched, missing };
}

/**
 * Menentukan warna indikator badge match score:
 * Hijau: score >= 70
 * Kuning: 40 <= score <= 69
 * Merah: score < 40
 */
export function getMatchColor(score: number): "green" | "yellow" | "red" {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}
