"use client";

import { useEffect, useState } from "react";
import { fetchAdminSettings, updateAdminSettings } from "@/lib/api";
import { useAdminLang } from "./AdminLanguageProvider";
import { Button, ErrorNotice, PageHeading, Panel, Skeleton, StateToggle, fieldInputClass, fieldLabelClass } from "./AdminUI";

type LoadState = "loading" | "ready" | "error";

export function SettingsForm() {
  const { t } = useAdminLang();
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [deliveryFee, setDeliveryFee] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [acceptingOrders, setAcceptingOrders] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAdminSettings()
      .then((settings) => {
        if (cancelled) return;
        setDeliveryFee(String(settings.deliveryFee));
        setMinOrderAmount(String(settings.minOrderAmount));
        setAcceptingOrders(settings.acceptingOrders);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : t.settings.loadFailed);
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [t.settings.loadFailed]);

  async function handleSave() {
    setSaveError("");
    setSaved(false);
    setSaving(true);
    try {
      const updated = await updateAdminSettings({
        deliveryFee: Number(deliveryFee),
        minOrderAmount: Number(minOrderAmount),
        acceptingOrders,
      });
      setDeliveryFee(String(updated.deliveryFee));
      setMinOrderAmount(String(updated.minOrderAmount));
      setAcceptingOrders(updated.acceptingOrders);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : t.settings.errSave);
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.settings.title} subtitle={t.settings.subtitle} />
        <Panel className="space-y-4 p-5">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-9 w-40" />
        </Panel>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-5">
        <PageHeading title={t.settings.title} />
        <ErrorNotice>
          {t.common.loadFailed}: {errorMessage}
        </ErrorNotice>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeading title={t.settings.title} subtitle={t.settings.subtitle} />

      <Panel className="max-w-md space-y-4 p-5">
        <div>
          <label className={fieldLabelClass} htmlFor="deliveryFee">
            {t.settings.deliveryFee}
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-on_surface/40"
            >
              ₺
            </span>
            <input
              id="deliveryFee"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className={`${fieldInputClass} pl-7 [font-variant-numeric:tabular-nums]`}
              value={deliveryFee}
              onChange={(event) => setDeliveryFee(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor="minOrderAmount">
            {t.settings.minOrderAmount}
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-on_surface/40"
            >
              ₺
            </span>
            <input
              id="minOrderAmount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className={`${fieldInputClass} pl-7 [font-variant-numeric:tabular-nums]`}
              value={minOrderAmount}
              onChange={(event) => setMinOrderAmount(event.target.value)}
            />
          </div>
        </div>

        <div>
          <p className={fieldLabelClass}>{t.settings.acceptingOrders}</p>
          <StateToggle
            tone={acceptingOrders ? "quiet" : "warn"}
            label={acceptingOrders ? t.settings.acceptingOn : t.settings.acceptingOff}
            actionLabel={t.settings.acceptingOrders}
            onClick={() => setAcceptingOrders((current) => !current)}
          />
        </div>

        {saveError ? <ErrorNotice>{saveError}</ErrorNotice> : null}

        <div className="flex items-center gap-3 border-t border-outline_variant pt-4">
          <Button variant="primary" loading={saving} onClick={() => void handleSave()}>
            {t.settings.save}
          </Button>
          {saved ? <span className="text-sm font-semibold text-success">{t.settings.saved}</span> : null}
        </div>
      </Panel>
    </div>
  );
}
