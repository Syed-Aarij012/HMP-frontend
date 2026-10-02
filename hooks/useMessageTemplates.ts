"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, describeApiError } from "@/lib/api-client";

export type QuickReply = {
  // System starters are keyed by a slug; a user's own templates by their numeric id.
  key: string;
  title: string;
  body: string;
  ownId: number | null;
};

type ApiTemplates = {
  system: { key: string; title: string; body: string }[];
  mine: { id: number; title: string; body: string }[];
};

/**
 * FR-C-031 "template quick-replies": the platform's starter replies plus the user's own
 * saved ones, which they can add from the composer and delete again.
 */
export function useMessageTemplates() {
  const [system, setSystem] = useState<QuickReply[]>([]);
  const [mine, setMine] = useState<QuickReply[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ data: ApiTemplates }>("/message-templates")
      .then((response) => {
        setSystem(response.data.system.map((t) => ({ key: `system-${t.key}`, title: t.title, body: t.body, ownId: null })));
        setMine(response.data.mine.map((t) => ({ key: `mine-${t.id}`, title: t.title, body: t.body, ownId: t.id })));
        setError(null);
      })
      // Quick replies are a convenience — a failure here must never block typing a message.
      .catch(() => setError("Quick replies couldn't be loaded."));
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const save = useCallback(async (title: string, body: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: { id: number; title: string; body: string } }>("/message-templates", {
        method: "POST",
        body: { title, body },
      });
      const saved = response.data;
      setMine((current) =>
        [...current, { key: `mine-${saved.id}`, title: saved.title, body: saved.body, ownId: saved.id }].sort((a, b) =>
          a.title.localeCompare(b.title)
        )
      );
      return true;
    } catch (err) {
      setError(describeApiError(err, "Couldn't save that quick reply."));
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    setError(null);
    try {
      await apiFetch(`/message-templates/${id}`, { method: "DELETE" });
      setMine((current) => current.filter((t) => t.ownId !== id));
    } catch (err) {
      setError(describeApiError(err, "Couldn't delete that quick reply."));
    }
  }, []);

  return { system, mine, error, saving, save, remove };
}
