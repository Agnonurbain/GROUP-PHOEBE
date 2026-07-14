export default function ProfilLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-phoebe-pearl" />
      <div className="rounded-xl border border-phoebe-pearl bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="mb-1 h-3 w-20 animate-pulse rounded bg-phoebe-pearl" />
              <div className="h-5 w-32 animate-pulse rounded bg-phoebe-pearl" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-phoebe-pearl bg-white p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-phoebe-pearl" />
      </div>
    </div>
  );
}
