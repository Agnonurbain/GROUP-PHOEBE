import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-phoebe-pearl px-4 py-12">
      <Link href="/" className="mb-8 text-2xl font-bold text-phoebe-anthracite">
        GROUP <span className="text-phoebe-green">PHOEBE</span>
      </Link>
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
