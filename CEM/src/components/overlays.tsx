import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, BellRing, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm animate-[fadeIn_0.25s_ease]" onClick={onClose} aria-hidden />
      <div className={cn("glass relative w-full animate-rise rounded-2xl shadow-2xl shadow-black/60", sizes[size])}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400" aria-label="Close dialog">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------- Drawer --------------------------------- */

export function Drawer({ open, onClose, title, children, width = "max-w-md" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-base/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <aside className={cn("absolute right-0 top-0 h-full w-full border-l border-line bg-panel shadow-2xl animate-[slideIn_0.3s_ease]", width)}>
        <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-ink" aria-label="Close panel">
            <X className="size-5" />
          </button>
        </div>
        <div className="h-[calc(100%-65px)] overflow-y-auto p-5">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

/* ------------------------------ ConfirmDialog ------------------------------ */

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex items-start gap-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", danger ? "bg-rose-500/12 text-rose-400" : "bg-amber-500/12 text-amber-300")}>
          <AlertTriangle className="size-5" aria-hidden />
        </div>
        <p className="text-sm leading-relaxed text-muted">{body}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------------------------- Toasts --------------------------------- */

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

interface ToastApi {
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);
let toastSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, body?: string) => {
      toastSeq += 1;
      const id = toastSeq;
      setToasts((t) => [...t.slice(-4), { id, kind, title, body }]);
      window.setTimeout(() => dismiss(id), 4600);
    },
    [dismiss],
  );

  const api: ToastApi = {
    success: (t, b) => push("success", t, b),
    error: (t, b) => push("error", t, b),
    info: (t, b) => push("info", t, b),
  };

  const iconFor: Record<ToastKind, ReactNode> = {
    success: <CheckCircle2 className="size-5 text-emerald-400" aria-hidden />,
    error: <XCircle className="size-5 text-rose-400" aria-hidden />,
    info: <Info className="size-5 text-cyan-300" aria-hidden />,
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2.5" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="glass pointer-events-auto flex animate-rise items-start gap-3 rounded-xl border-l-2 px-4 py-3.5 shadow-xl shadow-black/40" style={{ borderLeftColor: t.kind === "success" ? "#34d399" : t.kind === "error" ? "#fb7185" : "#22d3ee" }}>
              <span className="mt-0.5 shrink-0">{iconFor[t.kind]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.body ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.body}</p> : null}
              </div>
              <button onClick={() => dismiss(t.id)} className="shrink-0 rounded p-1 text-dim hover:text-ink" aria-label="Dismiss notification">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* --------------------------- Bell helper (unused icon guard) --------------- */
export const BellIcon = BellRing;
