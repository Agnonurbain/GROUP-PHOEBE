export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 animate-pulse">
      <div className="mb-8 h-4 w-48 rounded-full bg-[#2A2A2A]" />
      <div className="mb-4 h-10 w-72 rounded-lg bg-[#2A2A2A]" />
      <div className="mb-8 h-5 w-56 rounded bg-[#2A2A2A]" />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-[#2A2A2A]" />
            ))}
          </div>
          <div className="h-4 w-full rounded bg-[#2A2A2A]" />
          <div className="h-4 w-3/4 rounded bg-[#2A2A2A]" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-2xl bg-[#2A2A2A]" />
          <div className="h-48 rounded-2xl bg-[#2A2A2A]" />
        </div>
      </div>
    </div>
  )
}
