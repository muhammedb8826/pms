import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1>Welcome to the Dashboard</h1>
      <p>This is the dashboard for the application</p>
      <Link href="/dashboard">Go to Dashboard</Link>
    </div>
  );
}
