export function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
      <div className="text-center">
        <Mark className="mx-auto h-12 w-12" />
        <p className="mt-4 text-2xl font-semibold tracking-tight">Kitchen Profit Calculator</p>
        <p className="mt-1 text-sm text-ink-soft">Opening your kitchen…</p>
      </div>
    </div>
  );
}

export function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return <img src="/brand/logo.png" alt="" className={`shrink-0 rounded-[22%] object-cover ${className}`} />;
}
