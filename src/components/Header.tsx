"use client";

import React, { useRef, useState } from "react";

function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  React.useEffect(() => {
    const saved = (localStorage.getItem("jp_theme") as "light" | "dark") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("jp_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }
  return (
    <button
      onClick={toggle}
      className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

export default function Header({ showAuth = true }: { showAuth?: boolean }) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const toolsTimer = useRef<number | null>(null);
  const helpTimer = useRef<number | null>(null);
  const openWithCancel = (which: "tools" | "help") => {
    const t = which === "tools" ? toolsTimer : helpTimer;
    if (t.current) window.clearTimeout(t.current);
    (which === "tools" ? setToolsOpen : setHelpOpen)(true);
  };
  const closeWithDelay = (which: "tools" | "help") => {
    const t = which === "tools" ? toolsTimer : helpTimer;
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => {
      (which === "tools" ? setToolsOpen : setHelpOpen)(false);
    }, 180);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-950/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-6">
        {/* Centered nav */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-10 text-[15px]">
          <div
            className="relative"
            onMouseEnter={() => openWithCancel("tools")}
            onMouseLeave={() => closeWithDelay("tools")}
          >
            <button className="text-gray-700 dark:text-gray-300 hover:opacity-80" aria-haspopup="menu" aria-expanded={toolsOpen}>
              Tools ▾
            </button>
            {toolsOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-2"
                onMouseEnter={() => openWithCancel("tools")}
                onMouseLeave={() => closeWithDelay("tools")}
              >
                <a className="block px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" href="/">
                  PowerUp My Resume
                </a>
                <a className="block px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" href="/results">
                  Results
                </a>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => openWithCancel("help")}
            onMouseLeave={() => closeWithDelay("help")}
          >
            <button className="text-gray-700 dark:text-gray-300 hover:opacity-80" aria-haspopup="menu" aria-expanded={helpOpen}>
              Help ▾
            </button>
            {helpOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-2"
                onMouseEnter={() => openWithCancel("help")}
                onMouseLeave={() => closeWithDelay("help")}
              >
                <a className="block px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" href="/privacy">
                  Privacy
                </a>
                <a className="block px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" href="/terms">
                  Terms
                </a>
                <a className="block px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" href="/contact">
                  Contact
                </a>
              </div>
            )}
          </div>
        </nav>

        {/* Right cluster: auth + theme + brand at far right */}
        <div className="ml-auto flex items-center gap-3">
          {showAuth && (
            <>
              <a
                href="/login"
                className="rounded-xl px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Log in
              </a>
              <a
                href="/signup"
                className="rounded-xl px-4 py-2 text-sm text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700"
              >
                Sign up
              </a>
            </>
          )}
          <ThemeToggle />
          <a
            href="/"
            className="ml-2 text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 rounded-xl px-3 py-1 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
            title="Job PowerUp"
          >
            Job&nbsp;PowerUp
          </a>
        </div>
      </div>
    </header>
  );
}
