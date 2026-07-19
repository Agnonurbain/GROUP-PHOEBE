export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-gradient-to-r from-phoebe-pearl to-phoebe-pearl-warm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
            <div className="mb-3 h-3 w-24 animate-pulse rounded-lg bg-phoebe-pearl/70" />
            <div className="h-7 w-16 animate-pulse rounded-lg bg-phoebe-pearl" />
          </div>
        ))}
      </div>
    </div>
  );
}
