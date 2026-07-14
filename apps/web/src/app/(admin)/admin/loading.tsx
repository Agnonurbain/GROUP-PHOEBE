export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded bg-phoebe-pearl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-phoebe-pearl bg-white p-4">
            <div className="mb-2 h-3 w-24 animate-pulse rounded bg-phoebe-pearl" />
            <div className="h-7 w-16 animate-pulse rounded bg-phoebe-pearl" />
          </div>
        ))}
      </div>
    </div>
  );
}
