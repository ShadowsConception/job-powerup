"use client";

import React, { useRef, useState } from "react";

export default function Header() {
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
        <a href="/" className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          Job PowerUp
        </a>

        <nav className="hidden md:flex items-center gap-10 text-[15px] relative">
          {/* Tools */}
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
                className="absolute left-0 mt-2 w-64 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-2"
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

          {/* Help */}
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
                className="absolute left-0 mt-2 w-64 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-2"
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
      </div>
    </header>
  );
}
