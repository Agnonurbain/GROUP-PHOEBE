export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 animate-pulse">
      <div className="mb-8 h-4 w-32 rounded-full bg-[#2A2A2A]" />
      <div className="mb-4 h-10 w-80 rounded-lg bg-[#2A2A2A]" />
      <div className="mb-8 h-5 w-64 rounded bg-[#2A2A2A]" />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="aspect-video rounded-2xl bg-[#2A2A2A]" />
          <div className="h-4 w-full rounded bg-[#2A2A2A]" />
          <div className="h-4 w-3/4 rounded bg-[#2A2A2A]" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-40 rounded-2xl bg-[#2A2A2A]" />
          <div className="h-40 rounded-2xl bg-[#2A2A2A]" />
        </div>
      </div>
    </div>
  )
}
