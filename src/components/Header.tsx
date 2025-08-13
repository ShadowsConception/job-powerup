// src/components/Header.tsx
"use client";

import Link from "next/link";

export default function Header({ showAuth = true }: { showAuth?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-transparent/50 backdrop-blur supports-[backdrop-filter]:bg-transparent/45">
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          {/* If you have a logo image, drop it here; text fallback below */}
          <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Job PowerUp
          </span>
        </Link>

        {showAuth && (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-1.5 text-sm text-white bg-cyan-600 hover:bg-cyan-700"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
