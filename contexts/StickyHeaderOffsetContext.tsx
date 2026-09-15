"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type StickyHeaderOffsetContextValue = {
  offset: number;
  setOffset: (offset: number) => void;
};

const StickyHeaderOffsetContext =
  createContext<StickyHeaderOffsetContextValue | null>(null);

export function StickyHeaderOffsetProvider({ children }: { children: ReactNode }) {
  const [offset, setOffset] = useState(0);
  const value = useMemo(() => ({ offset, setOffset }), [offset]);

  return (
    <StickyHeaderOffsetContext.Provider value={value}>
      {children}
    </StickyHeaderOffsetContext.Provider>
  );
}

export function useStickyHeaderOffset() {
  return useContext(StickyHeaderOffsetContext)?.offset ?? 0;
}

type StickyHeaderOffsetSyncProps = {
  navRef: RefObject<HTMLElement | null>;
  isActive: boolean;
};

export function StickyHeaderOffsetSync({
  navRef,
  isActive,
}: StickyHeaderOffsetSyncProps) {
  const context = useContext(StickyHeaderOffsetContext);

  useEffect(() => {
    if (!context) {
      return;
    }

    const { setOffset } = context;
    const nav = navRef.current;

    if (!isActive || !nav) {
      setOffset(0);
      return;
    }

    const measure = () => {
      setOffset(nav.offsetHeight);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => {
      observer.disconnect();
      setOffset(0);
    };
  }, [context, isActive, navRef]);

  return null;
}
