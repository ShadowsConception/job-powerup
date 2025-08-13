'use client';

import React, { useEffect, useState } from 'react';

export default function FloatThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('jp_theme') as 'light' | 'dark') || 'light';
    setTheme(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('jp_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 left-6 z-40 rounded-full px-3 py-2 bg-gray-900 text-white hover:bg-black"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
