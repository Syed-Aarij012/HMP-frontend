"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DashboardSidebarContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  // Desktop-only "docked but narrow, icon-only" state — a separate concept from isOpen above,
  // which is the mobile off-canvas drawer (hidden entirely vs. slid in). Remembered across
  // visits since it's a per-viewer layout preference, not page content.
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const DashboardSidebarContext =
  createContext<DashboardSidebarContextValue | null>(null);

const DESKTOP_SIDEBAR_MIN_WIDTH = 992;
const COLLAPSED_STORAGE_KEY = "hmp_dashboard_sidebar_collapsed";

export function DashboardSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((current) => !current), []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1");
      } catch {
        // Storage unavailable (private mode etc.) — just starts expanded.
      }
    });
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Per-viewer convenience only — fine if it doesn't persist this time.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${DESKTOP_SIDEBAR_MIN_WIDTH}px)`,
    );

    const handleViewportChange = () => {
      if (mediaQuery.matches) {
        setIsOpen(false);
      }
    };

    handleViewportChange();
    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle, collapsed, toggleCollapsed }),
    [isOpen, open, close, toggle, collapsed, toggleCollapsed],
  );

  return (
    <DashboardSidebarContext.Provider value={value}>
      {children}
    </DashboardSidebarContext.Provider>
  );
}

export function useDashboardSidebar() {
  const context = useContext(DashboardSidebarContext);

  if (!context) {
    throw new Error(
      "useDashboardSidebar must be used within DashboardSidebarProvider",
    );
  }

  return context;
}
