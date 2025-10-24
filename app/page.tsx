import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="w-full border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="text-sm sm:text-base font-semibold">Pharmacy Management System</div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
        <h1>Welcome to the Dashboard</h1>
        <p>This is the dashboard for the application</p>
        <Link href="/dashboard">Go to Dashboard</Link>
      </main>
    </div>
  );
}
