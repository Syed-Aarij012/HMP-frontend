"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/*
 * The HMP UI kit — shared by the user dashboard and the Admin Panel so both read as one product.
 * Styles: app/_ui-kit.scss (scoped under `.hmp-ui`), built on the tokens in app/_tokens.scss.
 * Presentation only: nothing here fetches data or changes what a page does.
 */

// ---------------------------------------------------------------- Formatting

/** "pending_checks" → "pending checks". */
export function humanize(value: string | null | undefined): string {
  return (value ?? "").replace(/[_-]+/g, " ").trim();
}

/** £ amounts, consistently: whole pounds unless pence matter. */
export function formatMoney(value: number | string | null | undefined, options: { pence?: boolean } = {}): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return "—";
  const pence = options.pence ?? !Number.isInteger(amount);
  return amount.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence ? 2 : 0,
    maximumFractionDigits: pence ? 2 : 0,
  });
}

export function formatDate(value: string | Date | null | undefined, options: { time?: boolean } = {}): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(options.time ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
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

// ---------------------------------------------------------------- Page structure

export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="ha-page-head">
      <div>
        {eyebrow && <span className="ha-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ha-actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className = "", id }: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const headingId = useId();
  return (
    <section className={`ha-card ${className}`} aria-labelledby={title ? headingId : undefined} id={id}>
      {(title || actions) && (
        <div className="ha-card-head">
          <div>
            {title && <h2 id={headingId}>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="ha-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** A padded card body — for forms and free content inside a Card. */
export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`ha-card-body ${className}`}>{children}</div>;
}

export function StatCard({ label, value, note, href, icon, attention = false }: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  href?: string;
  icon?: string;
  attention?: boolean;
}) {
  const body = (
    <>
      <div className="ha-stat-label">
        {icon && <i className={icon} aria-hidden="true" />}
        {label}
      </div>
      <div className="ha-stat-value">{value}</div>
      {note && <div className="ha-stat-note">{note}</div>}
    </>
  );
  const className = `ha-card ha-stat${attention ? " is-attention" : ""}`;
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="ha-stats">{children}</div>;
}

/** A navigation tile: icon, title, one line of help. */
export function Tile({ href, title, text, icon = "icon-carus-diamondsfour" }: { href: string; title: string; text?: string; icon?: string }) {
  return (
    <Link href={href} className="ha-card ha-tile">
      <i className={icon} aria-hidden="true" />
      <div>
        <b>{title}</b>
        {text && <span>{text}</span>}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------- Status

export type Tone = "neutral" | "success" | "warning" | "danger" | "primary" | "dark";

export function Badge({ tone = "neutral", plain = false, children, title }: { tone?: Tone; plain?: boolean; children: ReactNode; title?: string }) {
  const toneClass = tone === "neutral" ? "" : ` is-${tone}`;
  return (
    <span className={`ha-badge${toneClass}${plain ? " is-plain" : ""}`} title={title}>
      {children}
    </span>
  );
}

const SUCCESS = /^(live|approved|active|paid|complete|completed|accepted|hammered|sold|delivered|released|verified|published|confirmed|won|leading|settled|enabled|passed|resolved|collected|funded|succeeded|available|in_stock|open_to_bids)$/;
const WARNING = /^(pending.*|awaiting.*|countered|provisional|draft|review|in_review|under_review|on_hold|held|requested|submitted|scheduled_review|partially.*|reserved|due|outbound|processing|queued|paused|flagged|needs.*)$/;
const DANGER = /^(declined|rejected|failed|cancelled|canceled|expired|withdrawn|not_sold|suspended|overdue|disputed|banned|revoked|lost|outbid|refunded|void|voided|blocked|closed_unsold|error|unpaid|defaulted|disabled)$/;
const PRIMARY = /^(open|scheduled|running|in_progress|assigned|in_transit|bidding|upcoming|new|sent|booked|accepted_pending|countdown|ready)$/;

export function statusTone(status: string | null | undefined): Tone {
  const key = (status ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  if (SUCCESS.test(key)) return "success";
  if (DANGER.test(key)) return "danger";
  if (WARNING.test(key)) return "warning";
  if (PRIMARY.test(key)) return "primary";
  return "neutral";
}

/** A status as text + tone (the dot and the words carry it — colour is never the only cue). */
export function StatusBadge({ status, label, tone }: { status: string | null | undefined; label?: ReactNode; tone?: Tone }) {
  if (!status && !label) return <span className="ha-sub">—</span>;
  return <Badge tone={tone ?? statusTone(status)}>{label ?? humanize(status)}</Badge>;
}

// ---------------------------------------------------------------- Feedback states

export function EmptyState({ title, text, icon = "icon-carus-listings", action }: { title: ReactNode; text?: ReactNode; icon?: string; action?: ReactNode }) {
  return (
    <div className="ha-empty">
      <i className={icon} aria-hidden="true" />
      <b>{title}</b>
      {text && <div>{text}</div>}
      {action && <div className="ha-actions">{action}</div>}
    </div>
  );
}

export function LoadingRows({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div className="ha-card-body" aria-busy="true" role="status">
      <span className="ha-visually-hidden">{label}…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="ha-skeleton" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

/** Table-shaped skeleton, so the layout doesn't jump when the rows arrive. */
export function LoadingTable({ rows = 5, columns = 4, label = "Loading" }: { rows?: number; columns?: number; label?: string }) {
  return (
    <div className="ha-skeleton-table" aria-busy="true" role="status">
      <span className="ha-visually-hidden">{label}…</span>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="ha-skeleton-row">
          {Array.from({ length: columns }, (_, col) => (
            <div key={col} className="ha-skeleton" style={{ maxWidth: col === 0 ? "none" : 140, opacity: 1 - row * 0.12 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Stroke icons (the icon font has no warning/info glyphs). Shape differs per tone, so the
// message type isn't carried by colour alone.
function NoticeIcon({ tone }: { tone: "info" | "success" | "warning" | "danger" }) {
  const paths: Record<typeof tone, ReactNode> = {
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
    success: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polyline points="8 12.5 11 15.5 16 9.5" />
      </>
    ),
    warning: (
      <>
        <path d="M12 3.5 2.5 20h19L12 3.5z" />
        <line x1="12" y1="10" x2="12" y2="14" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    danger: (
      <>
        <circle cx="12" cy="12" r="9" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
      </>
    ),
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
      {paths[tone]}
    </svg>
  );
}

/** An inline message. Errors are announced immediately (role=alert), the rest politely. */
export function Notice({ tone = "info", children, onDismiss, className = "" }: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={`ha-alert is-${tone} ${className}`} role={tone === "danger" ? "alert" : "status"}>
      <NoticeIcon tone={tone} />
      <div className="ha-alert-body">{children}</div>
      {onDismiss && (
        <button type="button" className="ha-alert-close" onClick={onDismiss} aria-label="Dismiss message">
          ×
        </button>
      )}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="ha-card-body">
      <Notice tone="danger">{message}</Notice>
    </div>
  );
}

// ---------------------------------------------------------------- Navigation within a page

export function Pager({ page, lastPage, total, onChange }: { page: number; lastPage: number; total?: number; onChange: (page: number) => void }) {
  if (lastPage <= 1 && total === undefined) return null;
  return (
    <nav className="ha-pager" aria-label="Pagination">
      <span aria-live="polite">
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
    </nav>
  );
}

export function Tabs<T extends string>({ value, options, onChange, label, labels }: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  label: string;
  labels?: Partial<Record<T, ReactNode>>;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next]);
    refs.current[next]?.focus();
  }

  return (
    <div className="ha-tabs" role="tablist" aria-label={label}>
      {options.map((option, index) => (
        <button
          key={option}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="button"
          role="tab"
          aria-selected={value === option}
          tabIndex={value === option ? 0 : -1}
          className={value === option ? "is-active" : undefined}
          onClick={() => onChange(option)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {labels?.[option] ?? option}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Modal

export function Modal({ open, title, description, children, footer, onClose, wide = false }: {
  open: boolean;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Move focus into the dialog, and back to where it was when it closes.
    const firstField = dialogRef.current?.querySelector<HTMLElement>("input, select, textarea, button, [href]");
    firstField?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      // Keep Tab inside the dialog.
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ha-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} className="ha-modal" role="dialog" aria-modal="true" aria-labelledby={headingId} style={wide ? { maxWidth: 640 } : undefined}>
        <div className="ha-modal-head">
          <h3 id={headingId}>{title}</h3>
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
      <div className="ha-toasts" aria-live="polite" role="status">
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

// ---------------------------------------------------------------- Search, filter, sort

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
    <div className="ha-search" role="search">
      <i className="icon-carus-search" aria-hidden="true" />
      <input className="ha-input" type="search" placeholder={placeholder} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export type FilterOption = { value: string; label: string };

export type ListFilter<T> = {
  key: string;
  label: string;
  /** The value(s) of this item for this filter (an array matches if any value matches). */
  get: (item: T) => string | string[] | null | undefined;
  /** Fixed options; when omitted they're built from the data. */
  options?: FilterOption[];
  /** How a value derived from the data is shown (default: humanized). */
  format?: (value: string) => string;
};

export type ListSort<T> = { value: string; label: string; compare: (a: T, b: T) => number };

/**
 * Client-side search, filter and sort over a list a page already has. It only narrows and
 * orders what's on screen — the data and every action on it are unchanged.
 */
export function useListControls<T>({ items, search, filters = [], sorts = [] }: {
  items: readonly T[];
  search?: (item: T) => Array<string | number | null | undefined>;
  filters?: ListFilter<T>[];
  sorts?: ListSort<T>[];
}) {
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(sorts[0]?.value ?? "");

  const resolvedFilters = useMemo(
    () =>
      filters.map((filter) => {
        if (filter.options) return { ...filter, options: filter.options };
        const seen = new Set<string>();
        items.forEach((item) => {
          const value = filter.get(item);
          (Array.isArray(value) ? value : [value]).forEach((v) => {
            if (v) seen.add(v);
          });
        });
        const format = filter.format ?? humanize;
        return {
          ...filter,
          options: Array.from(seen)
            .sort()
            .map((value) => ({ value, label: format(value) })),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, filters.length],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = items.filter((item) => {
      for (const filter of filters) {
        const wanted = values[filter.key];
        if (!wanted) continue;
        const value = filter.get(item);
        if (Array.isArray(value) ? !value.includes(wanted) : value !== wanted) return false;
      }
      if (!needle || !search) return true;
      return search(item).some((field) => field !== null && field !== undefined && String(field).toLowerCase().includes(needle));
    });
    const sorter = sorts.find((option) => option.value === sort);
    if (sorter) list = [...list].sort(sorter.compare);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, values, sort]);

  const active = resolvedFilters
    .filter((filter) => values[filter.key])
    .map((filter) => ({
      key: filter.key,
      label: filter.label,
      valueLabel: filter.options.find((option) => option.value === values[filter.key])?.label ?? values[filter.key],
    }));

  const setFilter = useCallback((key: string, value: string) => setValues((current) => ({ ...current, [key]: value })), []);
  const clearAll = useCallback(() => {
    setValues({});
    setQuery("");
  }, []);

  return {
    query,
    setQuery,
    values,
    setFilter,
    filters: resolvedFilters,
    active,
    clearAll,
    isFiltered: active.length > 0 || query.trim() !== "",
    sort,
    setSort,
    sorts,
    results,
    total: items.length,
    searchable: Boolean(search),
  };
}

export type ListControls<T> = ReturnType<typeof useListControls<T>>;

/**
 * Search + filter selects + sort, with the active filters shown as removable chips and a
 * single "Clear all". Sits at the top of a list Card.
 */
export function DataToolbar<T>({ controls, searchPlaceholder = "Search", searchLabel, noun = "result", children }: {
  controls: ListControls<T>;
  searchPlaceholder?: string;
  searchLabel?: string;
  noun?: string;
  children?: ReactNode;
}) {
  const { query, setQuery, filters, values, setFilter, sorts, sort, setSort, active, clearAll, isFiltered, results, total, searchable } = controls;
  const baseId = useId();
  const plural = (count: number) => `${count.toLocaleString("en-GB")} ${noun}${count === 1 ? "" : "s"}`;

  return (
    <>
      <div className="ha-toolbar">
        {searchable && <SearchInput value={query} onChange={setQuery} placeholder={searchPlaceholder} label={searchLabel ?? searchPlaceholder} />}
        {filters
          .filter((filter) => filter.options.length > 1 || values[filter.key])
          .map((filter) => (
            <label key={filter.key} className="ha-control-label" htmlFor={`${baseId}-${filter.key}`}>
              <span className="ha-visually-hidden">{filter.label}</span>
              <select id={`${baseId}-${filter.key}`} className="ha-select ha-inline-select" value={values[filter.key] ?? ""} onChange={(event) => setFilter(filter.key, event.target.value)}>
                <option value="">All {filter.label.toLowerCase()}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        {children}
        <div className="ha-toolbar-end">
          {sorts.length > 1 && (
            <label className="ha-control-label" htmlFor={`${baseId}-sort`}>
              Sort
              <select id={`${baseId}-sort`} className="ha-select ha-inline-select" value={sort} onChange={(event) => setSort(event.target.value)}>
                {sorts.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="ha-result-count" aria-live="polite">
            {isFiltered ? `${results.length.toLocaleString("en-GB")} of ${plural(total)}` : plural(total)}
          </span>
        </div>
      </div>
      {isFiltered && (
        <div className="ha-filterbar" aria-label="Active filters">
          {query.trim() !== "" && (
            <span className="ha-chip">
              “{query.trim()}”
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                ×
              </button>
            </span>
          )}
          {active.map((filter) => (
            <span key={filter.key} className="ha-chip">
              {filter.label}: {filter.valueLabel}
              <button type="button" onClick={() => setFilter(filter.key, "")} aria-label={`Remove ${filter.label} filter`}>
                ×
              </button>
            </span>
          ))}
          <button type="button" className="ha-link-btn" onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}
    </>
  );
}

/** "No matches" for a filtered list, with the way out. */
export function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon="icon-carus-search"
      title="No matches"
      text="Nothing matches your search and filters."
      action={
        <button type="button" className="ha-btn" onClick={onClear}>
          Clear filters
        </button>
      }
    />
  );
}

/** A data table with an accessible (visually hidden) caption; rows stack into cards on phones. */
export function DataTable({ caption, children, stacked = true }: { caption: string; children: ReactNode; stacked?: boolean }) {
  return (
    <div className="ha-table-wrap">
      <table className={`ha-table${stacked ? " is-stacked" : ""}`}>
        <caption className="ha-visually-hidden">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

// ---------------------------------------------------------------- Row actions

export type MenuAction = {
  label: string;
  onSelect?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
};

/**
 * "More actions" for a row: secondary actions live here so each row shows one clear primary
 * action. Keyboard: Enter/Space opens, arrows move, Escape closes and returns focus.
 */
export function ActionMenu({ actions, label = "More actions" }: { actions: MenuAction[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const visible = actions.filter(Boolean);

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>("[role='menuitem']:not([aria-disabled='true'])")?.focus();
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  if (visible.length === 0) return null;

  function onKeyDown(event: React.KeyboardEvent) {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  }

  return (
    <div className="ha-menu" ref={ref} onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        className="ha-btn is-sm is-ghost is-icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div id={menuId} className="ha-menu-panel" role="menu">
          {visible.map((action) =>
            action.href && !action.disabled ? (
              <Link key={action.label} href={action.href} role="menuitem" className={action.danger ? "is-danger" : undefined} onClick={() => setOpen(false)}>
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                className={action.danger ? "is-danger" : undefined}
                aria-disabled={action.disabled || undefined}
                onClick={() => {
                  if (action.disabled) return;
                  setOpen(false);
                  action.onSelect?.();
                }}
              >
                {action.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Native select (drop-in for NiceSelect)

export type SelectOption = { label: string; value: string | number };

/**
 * A native <select> with NiceSelect's props, so dashboard forms get real keyboard, screen-reader
 * and mobile picker support. onChange receives the option's original value (number stays number).
 */
export function Select({ options, defaultValue, value, onChange, id, className = "", ...rest }: {
  options: SelectOption[];
  defaultValue?: string | number;
  value?: string | number;
  onChange?: (value: string | number) => void;
  id?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  listClassName?: string;
}) {
  const { listClassName, ...selectProps } = rest;
  void listClassName;
  const controlled = value !== undefined;
  return (
    <select
      id={id}
      className={`ha-select ${className.replace(/\b(form-control|ha-input|nice-select)\b/g, "").trim()}`}
      {...(controlled ? { value: String(value) } : { defaultValue: defaultValue !== undefined ? String(defaultValue) : undefined })}
      onChange={(event) => {
        const option = options.find((candidate) => String(candidate.value) === event.target.value);
        onChange?.(option ? option.value : event.target.value);
      }}
      {...selectProps}
    >
      {options.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------- Active filters (server-side lists)

export type ActiveFilter = { key: string; label: ReactNode; onRemove: () => void };

/** Shows which filters are on, each removable, plus "Clear all". Renders nothing when none are. */
export function FilterChips({ filters, onClearAll }: { filters: Array<ActiveFilter | false | null | undefined>; onClearAll: () => void }) {
  const active = filters.filter(Boolean) as ActiveFilter[];
  if (active.length === 0) return null;
  return (
    <div className="ha-filterbar" aria-label="Active filters">
      {active.map((filter) => (
        <span key={filter.key} className="ha-chip">
          {filter.label}
          <button type="button" onClick={filter.onRemove} aria-label={`Remove filter: ${typeof filter.label === "string" ? filter.label : filter.key}`}>
            ×
          </button>
        </span>
      ))}
      <button type="button" className="ha-link-btn" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}
