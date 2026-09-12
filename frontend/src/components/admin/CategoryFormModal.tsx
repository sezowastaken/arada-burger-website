"use client";

import { useEffect, useState } from "react";
import type { AdminCategory, LocalizedText } from "@/lib/api";

interface Props {
  /** Editing an existing category, or null when creating a new one. */
  category: AdminCategory | null;
  onCancel: () => void;
  onSubmit: (name: LocalizedText) => Promise<void>;
}

export function CategoryFormModal({ category, onCancel, onSubmit }: Props) {
  const [nameTr, setNameTr] = useState(category?.name.tr ?? "");
  const [nameEn, setNameEn] = useState(category?.name.en ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNameTr(category?.name.tr ?? "");
    setNameEn(category?.name.en ?? "");
    setError("");
  }, [category]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!nameTr.trim() || !nameEn.trim()) {
      setError("Both Turkish and English names are required.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ tr: nameTr.trim(), en: nameEn.trim() });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save category");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold">{category ? "Edit category" : "New category"}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="categoryNameTr">
                Name (TR)
              </label>
              <input
                id="categoryNameTr"
                className={inputClass}
                value={nameTr}
                onChange={(event) => setNameTr(event.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="categoryNameEn">
                Name (EN)
              </label>
              <input
                id="categoryNameEn"
                className={inputClass}
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
              />
            </div>
          </div>

          {category ? (
            <p className="text-xs text-slate-500">
              URL slug stays <code className="rounded bg-slate-100 px-1">{category.slug}</code> —
              renaming a category does not change existing links.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              New categories start hidden from the public menu. Add products first, then activate it.
            </p>
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : category ? "Save changes" : "Create category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
