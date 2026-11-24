import { useRef, useState, type FormEvent } from "react";
import type { Application, ApplicationStatus, WorkMode } from "../types/index.ts";
import {
  createApplication,
  isDuplicate,
  parseSkills,
} from "../utils/application.ts";

interface ApplicationFormProps {
  applications: Application[];
  onAddApplication: (app: Application) => void;
}

interface FormState {
  company: string;
  role: string;
  workMode: WorkMode;
  status: "WISHLIST" | "APPLIED";
  skillsInput: string;
  cvVersion: string;
  appliedDate: string;
}

const INITIAL_FORM_STATE: FormState = {
  company: "",
  role: "",
  workMode: "Remote",
  status: "WISHLIST",
  skillsInput: "",
  cvVersion: "",
  appliedDate: new Date().toISOString().slice(0, 10), // default YYYY-MM-DD hari ini
};

/**
 * Komponen Form Tambah Lamaran Manual.
 * Mengimplementasikan form terkontrol penuh, validasi per-field,
 * auto-focus useRef ke field pertama yang error saat validasi gagal,
 * serta kondisional input untuk status APPLIED.
 */
export function ApplicationForm({
  applications,
  onAddApplication,
}: ApplicationFormProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // useRef untuk setiap elemen input agar dapat di-auto-focus bila terjadi error validasi
  const companyInputRef = useRef<HTMLInputElement>(null);
  const roleInputRef = useRef<HTMLInputElement>(null);
  const skillsInputRef = useRef<HTMLInputElement>(null);
  const cvVersionInputRef = useRef<HTMLInputElement>(null);
  const appliedDateInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    const newErrors: Record<string, string> = {};
    let firstErrorRef: React.RefObject<HTMLInputElement | null> | null = null;

    // 1. Validasi Perusahaan
    const trimmedCompany = formData.company.trim();
    if (!trimmedCompany) {
      newErrors.company = "Nama perusahaan wajib diisi.";
      if (!firstErrorRef) firstErrorRef = companyInputRef;
    }

    // 2. Validasi Posisi / Role
    const trimmedRole = formData.role.trim();
    if (!trimmedRole) {
      newErrors.role = "Posisi / role wajib diisi.";
      if (!firstErrorRef) firstErrorRef = roleInputRef;
    }

    // 3. Validasi Duplikasi Kombinasi Perusahaan + Posisi
    if (
      trimmedCompany &&
      trimmedRole &&
      isDuplicate(applications, trimmedCompany, trimmedRole)
    ) {
      newErrors.role = `Lamaran untuk posisi "${trimmedRole}" di "${trimmedCompany}" sudah pernah terdaftar.`;
      if (!firstErrorRef) firstErrorRef = roleInputRef;
    }

    // 4. Validasi Required Skills
    const parsedSkills = parseSkills(formData.skillsInput);
    if (parsedSkills.length === 0) {
      newErrors.skillsInput = "Masukkan minimal 1 skill (pisahkan dengan koma).";
      if (!firstErrorRef) firstErrorRef = skillsInputRef;
    }

    // 5. Validasi Kondisional untuk Status APPLIED
    if (formData.status === "APPLIED") {
      const trimmedCv = formData.cvVersion.trim();
      if (!trimmedCv) {
        newErrors.cvVersion = "Versi CV (mis. CV_v2_Frontend) wajib diisi untuk status APPLIED.";
        if (!firstErrorRef) firstErrorRef = cvVersionInputRef;
      }

      const trimmedDate = formData.appliedDate.trim();
      if (!trimmedDate) {
        newErrors.appliedDate = "Tanggal melamar wajib diisi untuk status APPLIED.";
        if (!firstErrorRef) firstErrorRef = appliedDateInputRef;
      }
    }

    // Jika ada error validasi: simpan error dan otomatis fokus ke input pertama yang bermasalah
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (firstErrorRef && firstErrorRef.current) {
        firstErrorRef.current.focus();
      }
      return;
    }

    // Validasi sukses: buat objek Application baru secara immutable
    const newApp = createApplication({
      company: trimmedCompany,
      role: trimmedRole,
      workMode: formData.workMode,
      status: formData.status as ApplicationStatus,
      requiredSkills: parsedSkills,
      cvVersion: formData.status === "APPLIED" ? formData.cvVersion.trim() : undefined,
      appliedDate: formData.status === "APPLIED" ? formData.appliedDate.trim() : undefined,
    });

    onAddApplication(newApp);

    // Reset form dan bersihkan state error
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setSuccessMessage(
      `Berhasil menambahkan lamaran "${newApp.role}" di "${newApp.company}" (Status: ${newApp.status})!`
    );

    // Auto-hilangkan notifikasi setelah 4 detik
    window.setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <section className="application-form-card">
      <div className="form-card-header">
        <h2 className="form-card-title">Tambah Lamaran Magang Manual</h2>
        <p className="form-card-desc">
          Catat lowongan yang kamu temukan dari LinkedIn, Glints, atau koneksi pribadi.
        </p>
      </div>

      {/* Banner Feedback Sukses */}
      {successMessage && (
        <div className="alert-banner alert-success" role="alert">
          <span>{successMessage}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setSuccessMessage(null)}
          >
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="manual-form">
        <div className="form-grid">
          {/* Input Perusahaan */}
          <div className="form-field-group">
            <label htmlFor="company-input" className="form-label">
              Perusahaan <span className="required-star">*</span>
            </label>
            <input
              id="company-input"
              ref={companyInputRef}
              type="text"
              value={formData.company}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, company: e.target.value }));
                if (errors.company) {
                  setErrors((prev) => ({ ...prev, company: "" }));
                }
              }}
              placeholder="Misal: GoTo, Traveloka, Shopee"
              className={`form-input ${errors.company ? "input-has-error" : ""}`}
            />
            {errors.company && (
              <p className="form-error-text">{errors.company}</p>
            )}
          </div>

          {/* Input Posisi / Role */}
          <div className="form-field-group">
            <label htmlFor="role-input" className="form-label">
              Posisi / Role <span className="required-star">*</span>
            </label>
            <input
              id="role-input"
              ref={roleInputRef}
              type="text"
              value={formData.role}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, role: e.target.value }));
                if (errors.role) {
                  setErrors((prev) => ({ ...prev, role: "" }));
                }
              }}
              placeholder="Misal: Frontend Engineer Intern"
              className={`form-input ${errors.role ? "input-has-error" : ""}`}
            />
            {errors.role && <p className="form-error-text">{errors.role}</p>}
          </div>

          {/* Pilihan Mode Kerja */}
          <div className="form-field-group">
            <label htmlFor="workmode-select" className="form-label">
              Mode Kerja <span className="required-star">*</span>
            </label>
            <select
              id="workmode-select"
              value={formData.workMode}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  workMode: e.target.value as WorkMode,
                }))
              }
              className="form-select"
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>

          {/* Pilihan Status Awal */}
          <div className="form-field-group">
            <label htmlFor="status-select" className="form-label">
              Status Awal <span className="required-star">*</span>
            </label>
            <select
              id="status-select"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as "WISHLIST" | "APPLIED",
                }))
              }
              className="form-select"
            >
              <option value="WISHLIST">WISHLIST (Ingin Dilamar)</option>
              <option value="APPLIED">APPLIED (Sudah Mengirim Lamaran)</option>
            </select>
          </div>
        </div>

        {/* Input Required Skills */}
        <div className="form-field-group full-width">
          <label htmlFor="skills-input" className="form-label">
            Skill yang Diminta (Required Skills) <span className="required-star">*</span>
          </label>
          <input
            id="skills-input"
            ref={skillsInputRef}
            type="text"
            value={formData.skillsInput}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, skillsInput: e.target.value }));
              if (errors.skillsInput) {
                setErrors((prev) => ({ ...prev, skillsInput: "" }));
              }
            }}
            placeholder="Pisahkan dengan koma, misal: React, TypeScript, Tailwind, Git"
            className={`form-input ${
              errors.skillsInput ? "input-has-error" : ""
            }`}
          />
          <p className="form-help-text">
            Format: skill dipisahkan dengan tanda koma (,). Spasi berlebih akan otomatis dibersihkan.
          </p>
          {errors.skillsInput && (
            <p className="form-error-text">{errors.skillsInput}</p>
          )}
        </div>

        {/* FIELD KONDISIONAL: Muncul hanya bila status === APPLIED */}
        {formData.status === "APPLIED" && (
          <div className="conditional-fields-box">
            <h4 className="conditional-box-title">
              Detail Pengiriman Lamaran (Wajib untuk Status APPLIED)
            </h4>
            <div className="form-grid">
              <div className="form-field-group">
                <label htmlFor="cv-input" className="form-label">
                  Versi CV <span className="required-star">*</span>
                </label>
                <input
                  id="cv-input"
                  ref={cvVersionInputRef}
                  type="text"
                  value={formData.cvVersion}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      cvVersion: e.target.value,
                    }));
                    if (errors.cvVersion) {
                      setErrors((prev) => ({ ...prev, cvVersion: "" }));
                    }
                  }}
                  placeholder="Misal: CV_Frontend_v3_EN.pdf"
                  className={`form-input ${
                    errors.cvVersion ? "input-has-error" : ""
                  }`}
                />
                {errors.cvVersion && (
                  <p className="form-error-text">{errors.cvVersion}</p>
                )}
              </div>

              <div className="form-field-group">
                <label htmlFor="date-input" className="form-label">
                  Tanggal Melamar <span className="required-star">*</span>
                </label>
                <input
                  id="date-input"
                  ref={appliedDateInputRef}
                  type="date"
                  value={formData.appliedDate}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      appliedDate: e.target.value,
                    }));
                    if (errors.appliedDate) {
                      setErrors((prev) => ({ ...prev, appliedDate: "" }));
                    }
                  }}
                  className={`form-input ${
                    errors.appliedDate ? "input-has-error" : ""
                  }`}
                />
                {errors.appliedDate && (
                  <p className="form-error-text">{errors.appliedDate}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg">
            💾 Simpan Lamaran
          </button>
        </div>
      </form>
    </section>
  );
}
