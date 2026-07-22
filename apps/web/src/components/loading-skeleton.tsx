export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 animate-pulse">
      <div className="mb-8 h-4 w-24 rounded-full bg-[#2A2A2A]" />
      <div className="mb-4 h-10 w-72 rounded-lg bg-[#2A2A2A]" />
      <div className="mb-8 h-5 w-96 rounded bg-[#2A2A2A]" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6">
            <div className="mb-4 h-4 w-20 rounded-full bg-[#2A2A2A]" />
            <div className="mb-2 h-5 w-3/4 rounded bg-[#2A2A2A]" />
            <div className="mb-1 h-4 w-full rounded bg-[#2A2A2A]" />
            <div className="h-4 w-1/2 rounded bg-[#2A2A2A]" />
          </div>
        ))}
      </div>
    </div>
  )
}
