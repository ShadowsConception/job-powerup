// src/components/FloatThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";

export default function FloatThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
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
      className="fixed bottom-6 left-6 z-50 rounded-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow-md hover:bg-white dark:hover:bg-gray-800"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
