"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminAnalytics, type AnalyticsSummary } from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import {
  Button,
  EmptyState,
  ErrorNotice,
  PageHeading,
  Panel,
  Skeleton,
  tabularNums,
} from "./AdminUI";

type LoadState = "loading" | "ready" | "error";

const RANGE_OPTIONS = [7, 14, 30] as const;

/** Small ranked list shared by the products/categories/referrers panels. */
function RankedList({
  title,
  rows,
  colLabel,
  emptyLabel,
}: {
  title: string;
  rows: { key: string; label: string; count: number }[];
  colLabel: string;
  emptyLabel: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <Panel className="p-4">
      <h3 className="text-[0.8125rem] font-bold uppercase tracking-wide text-on_surface/55">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-on_surface/45">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-sm text-on_surface">{row.label}</span>
              <span
                className={`h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-on_surface/[0.07]`}
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-primary/70"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </span>
              <span
                className={`w-10 shrink-0 text-right text-sm font-semibold text-on_surface ${tabularNums}`}
                title={colLabel}
              >
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Day-of-month from a "YYYY-MM-DD" key, read as UTC to match how the
 * backend zero-fills the range (see zeroFillDays in adminAnalytics.ts). */
function dayLabel(day: string): string {
  return String(Number(day.slice(8, 10)));
}

/**
 * A day-by-day bar chart built from divs — the traffic here never justifies a
 * charting dependency, and plain bars answer the only question this page
 * needs to: is a day up or down from the others.
 *
 * The backend always returns one row per day in the selected range, zero-
 * filled — a single real day of traffic inside a 7- or 30-day range renders
 * as one bar among many, not a lone block claiming the whole panel.
 */
function DailyTrend({
  title,
  data,
}: {
  title: string;
  data: AnalyticsSummary["daily"];
}) {
  const max = Math.max(1, ...data.map((day) => day.sessions));
  // More than ~10 date labels under 30 daily bars just becomes noise; thin
  // them out but always keep the first and last so the range's edges read.
  const labelEvery = Math.max(1, Math.ceil(data.length / 10));

  return (
    <Panel className="p-4">
      <h3 className="text-[0.8125rem] font-bold uppercase tracking-wide text-on_surface/55">{title}</h3>
      {data.length === 0 ? null : (
        <>
          {/* `items-end` alone leaves each column's height auto (content-
              sized), so a bar's `height: N%` resolves against a 0px parent
              and collapses to nothing. The columns stretch to the row's full
              height instead, and `justify-end` inside each one anchors the
              bar to the bottom. */}
          <div className="mt-4 flex h-28 items-stretch gap-1">
            {data.map((day) => (
              <div key={day.day} className="flex min-w-0 flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-sm bg-primary/70 transition-[height] duration-300"
                  style={{ height: `${Math.max(4, (day.sessions / max) * 100)}%` }}
                  title={`${day.day} · ${day.sessions} sessions · ${day.pageViews} page views`}
                />
              </div>
            ))}
          </div>

          {/* A second row, not a label per bar-column stacked on the bar
              itself — bars vary in height, so a label riding on top of each
              one would float at a different level per day instead of
              reading as one fixed axis underneath all of them. */}
          <div className="mt-1 flex gap-1">
            {data.map((day, index) => {
              const showLabel = index % labelEvery === 0 || index === data.length - 1;
              return (
                <div key={day.day} className="min-w-0 flex-1 text-center">
                  <span
                    className={`text-[0.625rem] font-semibold tabular-nums text-on_surface/40 ${
                      showLabel ? "" : "invisible"
                    }`}
                  >
                    {dayLabel(day.day)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}

export function AnalyticsDashboard() {
  const { t, lang } = useAdminLang();
  const [days, setDays] = useState<(typeof RANGE_OPTIONS)[number]>(7);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(
    async (range: number) => {
      setState("loading");
      setErrorMessage("");
      try {
        setData(await fetchAdminAnalytics(range));
        setState("ready");
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : t.analytics.loadFailed);
        setState("error");
      }
    },
    [t.analytics.loadFailed],
  );

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const deviceLabel: Record<string, string> = {
    mobile: t.analytics.deviceMobile,
    tablet: t.analytics.deviceTablet,
    desktop: t.analytics.deviceDesktop,
  };

  const rangeLabel: Record<(typeof RANGE_OPTIONS)[number], string> = {
    7: t.analytics.range7,
    14: t.analytics.range14,
    30: t.analytics.range30,
  };

  return (
    <div className="space-y-5">
      <PageHeading
        title={t.analytics.title}
        subtitle={t.analytics.subtitle}
        actions={
          <div className="inline-flex items-center rounded-full border border-outline_variant bg-surface_container_lowest p-0.5">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={days === option ? "primary" : "ghost"}
                onClick={() => setDays(option)}
                className="rounded-full"
              >
                {rangeLabel[option]}
              </Button>
            ))}
          </div>
        }
      />

      {state === "error" ? (
        <ErrorNotice>
          {errorMessage}{" "}
          <button type="button" className="underline" onClick={() => void load(days)}>
            {t.common.retry}
          </button>
        </ErrorNotice>
      ) : null}

      {state === "loading" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Panel key={i} className="p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-7 w-12" />
            </Panel>
          ))}
        </div>
      ) : null}

      {state === "ready" && data && data.totals.sessions === 0 ? (
        <Panel>
          <EmptyState title={t.analytics.emptyTitle} body={t.analytics.emptyBody} />
        </Panel>
      ) : null}

      {state === "ready" && data && data.totals.sessions > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Panel className="p-4">
              <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-on_surface/50">
                {t.analytics.sessions}
              </p>
              <p className={`mt-1.5 text-2xl font-bold text-on_surface ${tabularNums}`}>
                {data.totals.sessions}
              </p>
            </Panel>
            <Panel className="p-4">
              <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-on_surface/50">
                {t.analytics.pageViews}
              </p>
              <p className={`mt-1.5 text-2xl font-bold text-on_surface ${tabularNums}`}>
                {data.totals.pageViews}
              </p>
            </Panel>
            {(["mobile", "desktop", "tablet"] as const).map((device) => (
              <Panel key={device} className="p-4">
                <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-on_surface/50">
                  {deviceLabel[device]}
                </p>
                <p className={`mt-1.5 text-2xl font-bold text-on_surface ${tabularNums}`}>
                  {data.deviceSplit[device] ?? 0}
                </p>
              </Panel>
            ))}
          </div>

          <DailyTrend title={t.analytics.dailyTrend} data={data.daily} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RankedList
              title={t.analytics.topProducts}
              colLabel={t.analytics.colClicks}
              emptyLabel={t.analytics.emptyTitle}
              rows={data.topProducts.map((row) => ({
                key: row.slug,
                label: row.name ? row.name[lang] : t.analytics.unknownItem,
                count: row.clicks,
              }))}
            />
            <RankedList
              title={t.analytics.topCategories}
              colLabel={t.analytics.colClicks}
              emptyLabel={t.analytics.emptyTitle}
              rows={data.topCategories.map((row) => ({
                key: row.slug,
                label: row.name ? row.name[lang] : t.analytics.unknownItem,
                count: row.clicks,
              }))}
            />
            <RankedList
              title={t.analytics.topReferrers}
              colLabel={t.analytics.colSessions}
              emptyLabel={t.analytics.emptyTitle}
              rows={[
                ...data.topReferrers.map((row) => ({
                  key: row.host,
                  label: row.host,
                  count: row.sessions,
                })),
                ...(data.totals.directSessions > 0
                  ? [
                      {
                        key: "__direct__",
                        label: t.analytics.directTraffic,
                        count: data.totals.directSessions,
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          <div className="space-y-1 text-[0.75rem] text-on_surface/40">
            <p>{t.analytics.privacyNote}</p>
            <p>{t.analytics.approximateNote}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
