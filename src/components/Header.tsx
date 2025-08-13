"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ showAuth = true }: { showAuth?: boolean }) {
  const pathname = usePathname();
  const hideAuth = !showAuth || pathname === "/login" || pathname === "/signup";

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-6 h-14 md:h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3" aria-label="Job PowerUp home">
          {/* Gradient mark (inline so no asset needed). Replace with your SVG if you prefer. */}
          <svg
            viewBox="0 0 48 48"
            width="32"
            height="32"
            className="drop-shadow-sm"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="pu_mark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="40" height="40" rx="20" fill="url(#pu_mark)" />
            {/* simple chat bubble */}
            <path
              d="M15 18c0-2.761 2.239-5 5-5h8c2.761 0 5 2.239 5 5v3c0 2.761-2.239 5-5 5h-4.5l-4.2 3.2 1.4-3.9A5 5 0 0 1 15 21v-3z"
              fill="white"
              fillOpacity=".96"
            />
          </svg>

          <span className="text-lg md:text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Job PowerUp
          </span>
        </Link>

        {/* Auth actions */}
        {!hideAuth && (
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-2xl px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 dark:focus-visible:ring-offset-gray-950"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-gray-950"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
