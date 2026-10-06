"use client";

import { useState } from "react";
import { useMessageTemplates, type QuickReply } from "@/hooks/useMessageTemplates";

const chipStyle = {
  border: "1px solid #E9EDF4",
  borderRadius: 16,
  padding: "4px 12px",
  background: "#fff",
  fontSize: 13,
  whiteSpace: "nowrap" as const,
};

/**
 * FR-C-031: quick-reply picker above the composer. Picking one inserts its text into the
 * draft (appended if something's already typed) rather than sending it, so it can be edited
 * first. The current draft can be saved as a personal quick reply.
 */
export default function QuickReplies({
  draft,
  disabled,
  onInsert,
}: {
  draft: string;
  disabled: boolean;
  onInsert: (text: string) => void;
}) {
  const { system, mine, error, saving, save, remove } = useMessageTemplates();
  const [naming, setNaming] = useState(false);
  const [title, setTitle] = useState("");

  const insert = (reply: QuickReply) => onInsert(draft.trim() ? `${draft.trimEnd()} ${reply.body}` : reply.body);

  async function handleSave() {
    const name = title.trim();
    if (!name || !draft.trim()) return;
    if (await save(name, draft.trim())) {
      setNaming(false);
      setTitle("");
    }
  }

  if (system.length === 0 && mine.length === 0 && !error) return null;

  return (
    <div className="mb-2">
      <div className="flex gap-8 align-center" style={{ flexWrap: "wrap" }} role="group" aria-label="Quick replies">
        <span className="fs-13 text-color-2">Quick replies:</span>
        {system.map((reply) => (
          <button key={reply.key} type="button" style={chipStyle} disabled={disabled} title={reply.body} onClick={() => insert(reply)}>
            {reply.title}
          </button>
        ))}
        {mine.map((reply) => (
          <span key={reply.key} style={{ ...chipStyle, display: "inline-flex", gap: 6, alignItems: "center", background: "#F4F6FB" }}>
            <button
              type="button"
              disabled={disabled}
              title={reply.body}
              onClick={() => insert(reply)}
              style={{ border: "none", background: "none", padding: 0 }}
            >
              {reply.title}
            </button>
            <button
              type="button"
              aria-label={`Delete quick reply ${reply.title}`}
              onClick={() => reply.ownId !== null && remove(reply.ownId)}
              style={{ border: "none", background: "none", padding: 0, lineHeight: 1 }}
            >
              &times;
            </button>
          </span>
        ))}
        {!naming && draft.trim() && (
          <button type="button" style={{ ...chipStyle, borderStyle: "dashed" }} onClick={() => setNaming(true)}>
            + Save message as quick reply
          </button>
        )}
      </div>

      {naming && (
        <div className="flex gap-8 align-center mt-2" style={{ flexWrap: "wrap" }}>
          <input
            type="text"
            className="form-control"
            style={{ flex: "0 1 240px" }}
            placeholder="Name this quick reply"
            maxLength={80}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSave();
              }
            }}
            aria-label="Quick reply name"
          />
          <button type="button" style={chipStyle} disabled={saving || !title.trim()} onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" style={chipStyle} onClick={() => setNaming(false)}>
            Cancel
          </button>
        </div>
      )}

      {error && <p className="text-danger fs-13 mb-0 mt-1">{error}</p>}
    </div>
  );
}
