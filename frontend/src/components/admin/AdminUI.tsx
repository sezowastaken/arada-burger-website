"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Shared vocabulary for the admin panel.
 *
 * The public site is a poster; this is a tool. It inherits the brand's
 * materials — paper, ink, ketchup red — but not its ornament, because a
 * vintage frame around a data table would put the decoration in front of the
 * task. Brand lives here in precise details instead: the warm ground, tabular
 * figures, and red used in exactly three shapes.
 *
 * Note: this project overrides Tailwind's `rounded-lg` to 2rem and
 * `rounded-xl` to 3rem for the public site's over-rounded look. Admin radii
 * are written explicitly so they never inherit that scale.
 */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface_container_lowest";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const variantClass: Record<ButtonVariant, string> = {
  // Red as a solid fill means "this is the action".
  primary: "bg-primary text-background hover:bg-[#8c0002] active:bg-[#760002] shadow-sm",
  secondary:
    "border border-outline_variant bg-surface_container_lowest text-on_surface hover:bg-surface_container_low active:bg-surface_container_highest",
  ghost: "text-on_surface/70 hover:bg-surface_container_low hover:text-on_surface",
  // Destructive keeps the same hue but never the same shape, so it can never be
  // mistaken for the primary action sitting next to it.
  danger: "border border-danger/35 text-danger hover:bg-danger/[0.06] active:bg-danger/10",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-[0.8125rem]",
  md: "h-10 gap-2 px-4 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  // Defaults to "button": an untyped button inside a form submits it, which
  // looks like a saving bug rather than a markup one.
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[10px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${focusRing} ${variantClass[variant]} ${sizeClass[size]} ${className}`}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
    />
  );
}

/** Square icon button for dense controls like reorder arrows. */
export function IconButton({
  className = "",
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-outline_variant bg-surface_container_lowest text-on_surface/70 transition-[background-color,color,opacity] duration-150 hover:bg-surface_container_low hover:text-on_surface disabled:cursor-not-allowed disabled:opacity-25 ${focusRing} ${className}`}
    >
      {children}
    </button>
  );
}

export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[14px] border border-outline_variant bg-surface_container_lowest shadow-[0_1px_2px_rgba(30,28,16,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-on_surface">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[0.8125rem] text-on_surface/55">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * Healthy states are deliberately quiet and exceptions are loud. Thirty rows of
 * green "everything is fine" hides the two that are not, which is the opposite
 * of what an operations table is for.
 */
type BadgeTone = "quiet" | "off" | "warn";

// Hover deepens each tone rather than replacing it — a shared neutral hover
// would wipe the mustard off the one pill the eye is supposed to find.
const badgeTone: Record<BadgeTone, string> = {
  quiet: "bg-transparent text-on_surface/55 ring-1 ring-inset ring-outline_variant hover:bg-on_surface/[0.05]",
  off: "bg-on_surface/[0.06] text-on_surface/55 ring-1 ring-inset ring-on_surface/15 hover:bg-on_surface/[0.11]",
  // Mustard is the brand's promotional colour on the public site; here it is
  // reused for "needs your attention", which is the same job on a tool.
  warn: "bg-secondary/[0.12] text-secondary ring-1 ring-inset ring-secondary/35 hover:bg-secondary/20",
};

/**
 * A status that can be changed by tapping it. Rendered as a bordered control
 * rather than a label, because on a phone there is no hover to reveal that a
 * badge is interactive — and marking something sold out is the main phone job.
 */
export function StateToggle({
  tone,
  label,
  actionLabel,
  disabled,
  onClick,
}: {
  tone: BadgeTone;
  label: string;
  /** What tapping will do, for the tooltip and for screen readers. */
  actionLabel: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={actionLabel}
      aria-label={`${label} — ${actionLabel}`}
      className={`inline-flex min-h-[2.25rem] items-center whitespace-nowrap rounded-full px-3 text-[0.75rem] font-semibold transition-[background-color,border-color,color] duration-150 disabled:cursor-not-allowed disabled:opacity-45 md:min-h-[1.75rem] ${focusRing} ${badgeTone[tone]}`}
    >
      {label}
    </button>
  );
}

/** ₺600 rather than ₺600.00 — trailing zeros are noise in a column you scan. */
export function formatPrice(value: number) {
  return `₺${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-[10px] border border-danger/25 bg-danger/[0.05] px-3 py-2 text-sm text-danger"
    >
      {children}
    </p>
  );
}

/** Loading placeholder shaped like the content, rather than a spinner in the void. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-on_surface/[0.07] ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-outline_variant bg-surface_container_low/60 px-4 py-3">
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="divide-y divide-outline_variant/60">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: columns }, (_, column) => (
              <Skeleton
                key={column}
                className={`h-4 ${column === 0 ? "w-40" : "w-20"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** Empty states teach what the screen is for; "nothing here" teaches nothing. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="text-[0.9375rem] font-semibold text-on_surface">{title}</p>
      <p className="max-w-sm text-sm text-on_surface/55">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export const fieldLabelClass =
  "mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wide text-on_surface/55";

export const fieldInputClass = `w-full rounded-[10px] border border-outline_variant bg-surface_container_lowest px-3 py-2 text-sm text-on_surface transition-[border-color,box-shadow] duration-150 placeholder:text-on_surface/35 hover:border-on_surface/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-50`;

/** Prices and counts line up column to column instead of dancing. */
export const tabularNums = "[font-variant-numeric:tabular-nums]";
