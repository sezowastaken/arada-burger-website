"use client";

import { useEffect, useState } from "react";
import type { AdminCategory, LocalizedText } from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { AdminModal } from "./AdminModal";
import { Button, ErrorNotice, fieldInputClass, fieldLabelClass } from "./AdminUI";

interface Props {
  /** Editing an existing category, or null when creating a new one. */
  category: AdminCategory | null;
  onCancel: () => void;
  onSubmit: (name: LocalizedText) => Promise<void>;
}

export function CategoryFormModal({ category, onCancel, onSubmit }: Props) {
  const { t } = useAdminLang();
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
      setError(t.categoryForm.errNames);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ tr: nameTr.trim(), en: nameEn.trim() });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t.categoryForm.errSave);
      setSaving(false);
    }
  }

  return (
    <AdminModal
      title={category ? t.categoryForm.editTitle : t.categoryForm.createTitle}
      onClose={onCancel}
      width="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass} htmlFor="categoryNameTr">
              {t.categoryForm.nameTr}
            </label>
            <input
              id="categoryNameTr"
              className={fieldInputClass}
              value={nameTr}
              onChange={(event) => setNameTr(event.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="categoryNameEn">
              {t.categoryForm.nameEn}
            </label>
            <input
              id="categoryNameEn"
              className={fieldInputClass}
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
            />
          </div>
        </div>

        <p className="rounded-[10px] bg-surface_container_low px-3 py-2.5 text-[0.8125rem] leading-relaxed text-on_surface/60">
          {category ? t.categoryForm.slugNote(category.slug) : t.categoryForm.hiddenNote}
        </p>

        {error ? <ErrorNotice>{error}</ErrorNotice> : null}

        <div className="flex justify-end gap-2 border-t border-outline_variant pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? t.common.saving : category ? t.categoryForm.save : t.categoryForm.create}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
