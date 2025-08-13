'use client';

import React from 'react';

export default function Header({ showAuth = false }: { showAuth?: boolean }) {
  return (
    <header className="border-b border-transparent bg-transparent/50 backdrop-blur supports-[backdrop-filter]:bg-transparent/45">
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-3 group">
          {/* PowerUp logo bubble */}
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-indigo-400 grid place-items-center shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24" className="fill-white">
              <path d="M2 5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H9l-5 5v-5H5a3 3 0 0 1-3-3V5z" />
            </svg>
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Job PowerUp
          </span>
        </a>

        {showAuth && (
          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="rounded-xl px-3 py-1.5 text-sm text-white bg-cyan-600 hover:bg-cyan-700"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-xl px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign up
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
