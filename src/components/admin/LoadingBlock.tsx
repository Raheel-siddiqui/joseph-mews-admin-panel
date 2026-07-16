export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-md border border-border bg-card/40 py-16">
      <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
    </div>
  );
}
