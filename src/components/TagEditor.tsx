"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Tag } from "@/db/schema";
import { api } from "@/lib/api-client";
import { SUGGESTED_TAGS } from "@/lib/constants";

export function TagEditor({
  candidateId,
  tags,
  onChange,
}: {
  candidateId: string;
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const updated = await api.post<Tag[]>(`/api/candidates/${candidateId}/tags`, { name: trimmed });
      onChange(updated);
      setInput("");
    } finally {
      setBusy(false);
    }
  }

  async function removeTag(tagId: string) {
    setBusy(true);
    try {
      const updated = await api.del<Tag[]>(`/api/candidates/${candidateId}/tags?tagId=${tagId}`);
      onChange(updated);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = SUGGESTED_TAGS.filter((s) => !tags.some((t) => t.name.toLowerCase() === s.toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700"
          >
            {tag.name}
            <button onClick={() => removeTag(tag.id)} className="text-orange-400 hover:text-orange-700" aria-label={`Remove ${tag.name}`}>
              <X size={11} />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-stone-400">No tags yet</span>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTag(input);
        }}
        className="flex gap-1.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a tag…"
          list="tag-suggestions"
          className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
        />
        <datalist id="tag-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-stone-900 px-2.5 text-white disabled:opacity-40"
          aria-label="Add tag"
        >
          <Plus size={14} />
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-dashed border-stone-300 px-2.5 py-1 text-[11px] text-stone-500 hover:border-orange-300 hover:text-orange-600"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
