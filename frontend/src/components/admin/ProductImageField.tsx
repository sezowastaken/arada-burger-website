"use client";

import { useRef, useState } from "react";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  uploadProductImage,
} from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { Button, FieldError, fieldLabelClass } from "./AdminUI";

/**
 * Phones and some file managers report no type at all, or
 * `application/octet-stream`, for a perfectly good JPEG. The server decides the
 * format from the file's own bytes for exactly that reason, so refusing here on
 * a type the browser guessed would reject real photos before they are ever
 * sent. Only a type that positively says "not an image" is turned away.
 */
const UNRELIABLE_TYPES = ["", "application/octet-stream"];

function plausiblyAnImage(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type) || UNRELIABLE_TYPES.includes(file.type);
}

/**
 * Picks a product image and uploads it immediately, so what the form shows is
 * the file the public site will actually serve — not a local preview that
 * might still fail on save.
 *
 * There is no path text field any more. The paths are machine-generated and a
 * typed one is either a guess or a typo; the images that shipped with the site
 * keep their `/menu/products/...` path until someone replaces them.
 */
export function ProductImageField({
  value,
  onChange,
  invalid,
  errorId,
}: {
  value: string;
  onChange: (path: string) => void;
  invalid?: boolean;
  errorId?: string;
}) {
  const { t } = useAdminLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    setError("");

    if (!plausiblyAnImage(file)) {
      setError(t.productForm.errImageType);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t.productForm.errImageSize);
      return;
    }

    setUploading(true);
    try {
      onChange(await uploadProductImage(file));
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error ? uploadError.message : t.productForm.errImageUpload,
      );
    } finally {
      setUploading(false);
    }
  }

  const describedBy = [error ? "image-upload-error" : null, invalid ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <span className={fieldLabelClass}>{t.productForm.image}</span>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void accept(event.dataTransfer.files[0]);
        }}
        className={`flex items-center gap-4 rounded-[12px] border border-dashed p-3 transition-colors duration-150 ${
          dragging
            ? "border-primary bg-primary/[0.04]"
            : invalid
              ? "border-danger bg-surface_container_low/40"
              : "border-outline_variant bg-surface_container_low/40"
        }`}
      >
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-outline_variant bg-surface_container_highest">
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={value}
              alt={t.productForm.imagePreviewAlt}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="px-1 text-center text-[0.625rem] font-semibold uppercase tracking-wide text-on_surface/35">
              {t.productForm.imageEmpty}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              loading={uploading}
              onClick={() => inputRef.current?.click()}
              // On the visible control, not the hidden input: a screen reader
              // never reaches an element with `display: none`.
              aria-describedby={describedBy || undefined}
              aria-invalid={invalid || Boolean(error) || undefined}
            >
              {uploading
                ? t.productForm.imageUploading
                : value
                  ? t.productForm.imageReplace
                  : t.productForm.imageUpload}
            </Button>
            {value && !uploading ? (
              <Button size="sm" variant="ghost" onClick={() => onChange("")}>
                {t.productForm.imageRemove}
              </Button>
            ) : null}
          </div>

          <p className="mt-1.5 text-[0.75rem] text-on_surface/50">{t.productForm.imageHint}</p>
          <p className="hidden text-[0.75rem] text-on_surface/35 sm:block">
            {t.productForm.imageDropHint}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          // A phone offers the camera for this accept list, which is how a
          // product photo actually gets taken in the shop.
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(event) => {
            void accept(event.target.files?.[0]);
            // Cleared so picking the same file twice still fires a change —
            // otherwise a retry after a failed upload does nothing.
            event.target.value = "";
          }}
        />
      </div>

      {error ? <FieldError id="image-upload-error">{error}</FieldError> : null}
    </div>
  );
}
