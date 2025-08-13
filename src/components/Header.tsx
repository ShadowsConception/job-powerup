"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Header({ showAuth = true }: { showAuth?: boolean }) {
  const pathname = usePathname();
  const hideAuth = !showAuth || pathname === "/login" || pathname === "/signup";

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3" aria-label="Job PowerUp home">
          {/* Gradient mark (swap for your logo file if you have one) */}
          <svg viewBox="0 0 48 48" width="36" height="36" className="drop-shadow-sm" aria-hidden="true">
            <defs>
              <linearGradient id="pu_mark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="40" height="40" rx="20" fill="url(#pu_mark)" />
            <path
              d="M15 18c0-2.8 2.2-5 5-5h8c2.8 0 5 2.2 5 5v3c0 2.8-2.2 5-5 5h-4.5l-4.2 3.2 1.4-3.9A5 5 0 0 1 15 21v-3z"
              fill="white"
              fillOpacity=".96"
            />
          </svg>
          <span className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Job PowerUp
          </span>
        </Link>

        {/* Primary Nav + Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Dropdown: Pages */}
          <PagesMenu />

          {!hideAuth && (
            <nav className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-2xl px-4 py-2 text-sm md:text-base font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 dark:focus-visible:ring-offset-gray-950"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-2xl px-4 py-2 text-sm md:text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-gray-950"
              >
                Sign up
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------
   Dropdown component (Pages)
------------------------------ */
function PagesMenu() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm md:text-base font-medium
                   text-gray-800 dark:text-gray-100 bg-white/70 dark:bg-gray-900/70
                   border border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800
                   shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        Pages
        <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Pages"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 dark:border-gray-800
                     bg-white dark:bg-gray-950 shadow-lg ring-1 ring-black/5 overflow-hidden"
        >
          <MenuItem href="/pages" label="My Pages" description="Your personal pages" />
          <Divider />
          <MenuItem href="/privacy" label="Privacy" description="How we handle data" />
          <MenuItem href="/terms" label="Terms" description="User agreement" />
          <MenuItem href="/contact" label="Contact" description="Get in touch" />
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, label, description }: { href: string; label: string; description?: string }) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900"
    >
      <div className="mt-0.5 h-2 w-2 rounded-full bg-indigo-600" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
        {description ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
        ) : null}
      </div>
    </Link>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-gray-200 dark:bg-gray-800" />;
}
