"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/*
 * The Admin Panel's small UI kit. Styles live in app/_admin-panel.scss under `.hmp-admin`.
 */

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="ha-page-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ha-actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`ha-card ${className}`}>
      {(title || actions) && (
        <div className="ha-card-head">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, note, href, icon, attention = false }: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  href: string;
  icon?: string;
  attention?: boolean;
}) {
  return (
    <Link href={href} className={`ha-card ha-stat${attention ? " is-attention" : ""}`}>
      <div className="ha-stat-label">
        {icon && <i className={icon} aria-hidden="true" />}
        {label}
      </div>
      <div className="ha-stat-value">{value}</div>
      {note && <div className="ha-stat-note">{note}</div>}
    </Link>
  );
}

export type Tone = "neutral" | "success" | "warning" | "danger" | "primary" | "dark";

export function Badge({ tone = "neutral", plain = false, children, title }: { tone?: Tone; plain?: boolean; children: ReactNode; title?: string }) {
  const toneClass = tone === "neutral" ? "" : ` is-${tone}`;
  return (
    <span className={`ha-badge${toneClass}${plain ? " is-plain" : ""}`} title={title}>
      {children}
    </span>
  );
}

export function EmptyState({ title, text, icon = "icon-carus-listings" }: { title: string; text?: ReactNode; icon?: string }) {
  return (
    <div className="ha-empty">
      <i className={icon} aria-hidden="true" />
      <b>{title}</b>
      {text}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="ha-card-body" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="ha-skeleton" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="ha-card-body">
      <div className="ha-alert is-danger" role="alert">
        {message}
      </div>
    </div>
  );
}

export function Pager({ page, lastPage, total, onChange }: { page: number; lastPage: number; total?: number; onChange: (page: number) => void }) {
  if (lastPage <= 1 && total === undefined) return null;
  return (
    <div className="ha-pager">
      <span>
        {total !== undefined ? `${total.toLocaleString("en-GB")} result${total === 1 ? "" : "s"}` : ""}
        {lastPage > 1 ? ` · page ${page} of ${lastPage}` : ""}
      </span>
      {lastPage > 1 && (
        <div className="ha-actions">
          <button type="button" className="ha-btn is-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
            Previous
          </button>
          <button type="button" className="ha-btn is-sm" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export function Tabs<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange: (value: T) => void; label: string }) {
  return (
    <div className="ha-tabs" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button key={option} type="button" role="tab" aria-selected={value === option} className={value === option ? "is-active" : undefined} onClick={() => onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, title, description, children, footer, onClose, wide = false }: {
  open: boolean;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ha-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="ha-modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { maxWidth: 640 } : undefined}>
        <div className="ha-modal-head">
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {children && <div className="ha-modal-body">{children}</div>}
        {footer && <div className="ha-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Toasts

type Toast = { id: number; message: string; error: boolean };
type ToastApi = { notify: (message: string, options?: { error?: boolean }) => void };

const ToastContext = createContext<ToastApi>({ notify: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, options?: { error?: boolean }) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, error: options?.error ?? false }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="ha-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`ha-toast${toast.error ? " is-error" : ""}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** A value that only settles after the user stops typing — for search boxes. */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
  return (
    <div className="ha-search">
      <i className="icon-carus-search" aria-hidden="true" />
      <input className="ha-input" type="search" placeholder={placeholder} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function initials(name: string | null | undefined): string {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
