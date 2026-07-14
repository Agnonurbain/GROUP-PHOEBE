export default function CatalogueLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-phoebe-pearl" />
      <div className="mb-6 rounded-xl border border-phoebe-pearl bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-phoebe-pearl" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-phoebe-pearl bg-white">
            <div className="aspect-[4/3] w-full animate-pulse bg-phoebe-pearl" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-phoebe-pearl" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-phoebe-pearl" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-phoebe-pearl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
