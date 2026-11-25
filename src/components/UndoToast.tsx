import type { Application } from "../types/index.ts";

interface UndoToastProps {
  deletedApp: Application | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ deletedApp, onUndo, onDismiss }: UndoToastProps) {
  if (!deletedApp) {
    return null;
  }

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span>
        Lamaran <strong>{deletedApp.role}</strong> di{" "}
        <strong>{deletedApp.company}</strong> dihapus.
      </span>
      <div className="undo-toast-actions">
        <button type="button" className="btn btn-sm btn-primary" onClick={onUndo}>
          ↩️ Undo (5d)
        </button>
        <button
          type="button"
          className="alert-close"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
        >
          &times;
        </button>
      </div>
    </div>
  );
}