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

      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-white to-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Pharmacy Management System
              </h1>
              <p className="mt-4 text-gray-600 text-base sm:text-lg">
                Manage inventory, sales, purchases, customers, suppliers and reports in one
                place. Streamline daily operations with a modern, easy-to-use dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Create an account
                </Link>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-md text-blue-600 hover:text-blue-700"
                >
                  View dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
            <h2 className="text-xl sm:text-2xl font-semibold">Everything you need</h2>
            <p className="mt-2 text-sm text-gray-600 max-w-2xl">
              Powerful modules designed for pharmacy operations.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-xl border p-5 bg-white">
                <h3 className="font-semibold">Inventory Management</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Track stock levels, expiries, and product movements accurately.
                </p>
              </div>
              <div className="rounded-xl border p-5 bg-white">
                <h3 className="font-semibold">Sales & Billing</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Fast point-of-sale with detailed receipts and daily summaries.
                </p>
              </div>
              <div className="rounded-xl border p-5 bg-white">
                <h3 className="font-semibold">Purchases</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Manage purchase orders, suppliers, and stock intake.
                </p>
              </div>
              <div className="rounded-xl border p-5 bg-white">
                <h3 className="font-semibold">Customers</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Maintain customer records and improve service quality.
                </p>
              </div>
              <div className="rounded-xl border p-5 bg-white">
                <h3 className="font-semibold">Reports</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Real-time insights across sales, inventory, and finance.
                </p>
              </div>
              <div className="rounded-xl border p-5 bg-white">
                <h3 className="font-semibold">User Roles</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Fine-grained access control for admins, finance, operators, and more.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
