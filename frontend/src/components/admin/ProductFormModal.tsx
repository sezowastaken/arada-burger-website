"use client";

import { useEffect, useState } from "react";
import type { AdminCategory, AdminProduct, ProductInput } from "@/lib/api";

interface Props {
  categories: AdminCategory[];
  /** Editing an existing product, or null when creating a new one. */
  product: AdminProduct | null;
  onCancel: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
}

interface FormState {
  categoryId: string;
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  price: string;
  image: string;
}

function initialState(product: AdminProduct | null, categories: AdminCategory[]): FormState {
  return {
    categoryId: String(product?.categoryId ?? categories[0]?.id ?? ""),
    nameTr: product?.name.tr ?? "",
    nameEn: product?.name.en ?? "",
    descriptionTr: product?.description.tr ?? "",
    descriptionEn: product?.description.en ?? "",
    price: product ? product.price.toFixed(2) : "",
    image: product?.image ?? "",
  };
}

export function ProductFormModal({ categories, product, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(() => initialState(product, categories));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialState(product, categories));
    setError("");
  }, [product, categories]);

  const update = (field: keyof FormState) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const price = Number(form.price);
    if (!form.nameTr.trim() || !form.nameEn.trim()) {
      setError("Both Turkish and English names are required.");
      return;
    }
    if (!form.image.trim()) {
      setError("Image path is required.");
      return;
    }
    if (!form.price.trim() || Number.isNaN(price) || price < 0) {
      setError("Price must be a number of 0 or more.");
      return;
    }
    if (!form.categoryId) {
      setError("Category is required.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        categoryId: Number(form.categoryId),
        name: { tr: form.nameTr.trim(), en: form.nameEn.trim() },
        description: { tr: form.descriptionTr.trim(), en: form.descriptionEn.trim() },
        price,
        image: form.image.trim(),
      });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save product");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold">{product ? "Edit product" : "New product"}</h2>
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
              <label className={labelClass} htmlFor="nameTr">
                Name (TR)
              </label>
              <input id="nameTr" className={inputClass} value={form.nameTr} onChange={update("nameTr")} />
            </div>
            <div>
              <label className={labelClass} htmlFor="nameEn">
                Name (EN)
              </label>
              <input id="nameEn" className={inputClass} value={form.nameEn} onChange={update("nameEn")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="descriptionTr">
                Description (TR)
              </label>
              <textarea
                id="descriptionTr"
                rows={3}
                className={inputClass}
                value={form.descriptionTr}
                onChange={update("descriptionTr")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="descriptionEn">
                Description (EN)
              </label>
              <textarea
                id="descriptionEn"
                rows={3}
                className={inputClass}
                value={form.descriptionEn}
                onChange={update("descriptionEn")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="categoryId">
                Category
              </label>
              <select
                id="categoryId"
                className={inputClass}
                value={form.categoryId}
                onChange={update("categoryId")}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="price">
                Price (₺)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.price}
                onChange={update("price")}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="image">
              Image path
            </label>
            <input
              id="image"
              className={inputClass}
              placeholder="/menu/products/Example.png"
              value={form.image}
              onChange={update("image")}
            />
          </div>

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
              {saving ? "Saving…" : product ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
