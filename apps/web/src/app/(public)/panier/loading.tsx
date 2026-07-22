import { Card } from "@/components/ui"

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 animate-pulse">
      <div className="mb-8 h-4 w-24 rounded-full bg-[#2A2A2A]" />
      <div className="mb-6 h-10 w-48 rounded-lg bg-[#2A2A2A]" />
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <div className="mb-3 h-4 w-32 rounded-full bg-[#2A2A2A]" />
            <div className="mb-2 h-5 w-3/4 rounded bg-[#2A2A2A]" />
            <div className="h-4 w-1/3 rounded bg-[#2A2A2A]" />
          </Card>
        ))}
      </div>
    </div>
  )
}
