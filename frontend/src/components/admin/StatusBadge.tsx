export function StatusBadge({ ok, onLabel, offLabel }: { ok: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
      }`}
    >
      {ok ? onLabel : offLabel}
    </span>
  );
}
