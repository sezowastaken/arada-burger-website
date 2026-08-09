export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">Coming soon.</p>
    </div>
  );
}
