'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type ParsedInputs = {
  resumeText: string;
  jobLink: string;
  jobDescription: string;
};

const APP_VERSION =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_VERSION) || 'v0.1.0';

function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true,
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    if (!html.dataset.themeInit) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) html.classList.add('dark');
      html.dataset.themeInit = '1';
      setIsDark(prefersDark);
    }
  }, []);

  const toggle = useCallback(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.classList.toggle('dark');
    setIsDark(html.classList.contains('dark'));
  }, []);

  return { isDark, toggle };
}

function HoverMenu({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const enter = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setOpen(true);
  };
  const leave = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(false), 120);
  };
  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition"
        type="button"
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute left-0 mt-2 w-64 rounded-2xl border border-white/10 bg-black/80 backdrop-blur shadow-xl p-2"
          onMouseEnter={enter}
          onMouseLeave={leave}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function Header() {
  const { isDark, toggle } = useTheme();
  return (
    <header className="w-full">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-indigo-400 grid place-items-center shadow-md">
            {/* chat bubble */}
            <svg width="18" height="18" viewBox="0 0 24 24" className="fill-white">
              <path d="M2 5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H9l-5 5v-5H5a3 3 0 0 1-3-3V5z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">Job PowerUp</span>
          <div className="hidden md:flex items-center gap-1 ml-4">
            <HoverMenu label="Features">
              <div className="flex flex-col">
                <a className="px-3 py-2 rounded-xl hover:bg-white/5 text-white/90" href="#">
                  Resume Enhancer
                </a>
                <a className="px-3 py-2 rounded-xl hover:bg-white/5 text-white/90" href="#">
                  Cover Letter Writer
                </a>
                <a className="px-3 py-2 rounded-xl hover:bg-white/5 text-white/90" href="#">
                  Interview Quizzer
                </a>
              </div>
            </HoverMenu>
            <HoverMenu label="Resources">
              <div className="flex flex-col">
                <a className="px-3 py-2 rounded-xl hover:bg-white/5 text-white/90" href="/privacy">
                  Privacy
                </a>
                <a className="px-3 py-2 rounded-xl hover:bg-white/5 text-white/90" href="/terms">
                  Terms
                </a>
                <a className="px-3 py-2 rounded-xl hover:bg-white/5 text-white/90" href="/contact">
                  Contact
                </a>
              </div>
            </HoverMenu>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark / light toggle next to bubble */}
          <button
            type="button"
            onClick={toggle}
            title="Toggle theme"
            className="h-9 px-3 rounded-xl border border-white/15 text-white/90 hover:bg-white/10 transition"
          >
            {isDark ? '🌙' : '☀️'}
          </button>

          {/* Force white text for auth links */}
          <nav className="flex items-center gap-2">
            <a className="px-3 py-2 rounded-xl text-white hover:bg-white/10 transition" href="/login">
              Login
            </a>
            <a
              className="px-3 py-2 rounded-xl text-white bg-white/10 hover:bg-white/20 transition"
              href="/signup"
            >
              Sign up
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function Page() {
  const router = useRouter();

  const [resumeText, setResumeText] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (file: File) => {
    setFileName(file.name);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      let res = await fetch('/api/parse-resume', { method: 'POST', body: form });
      if (!res.ok) {
        res = await fetch('/api/parse', { method: 'POST', body: form });
      }
      if (res.ok) {
        const data = await res.json();
        setResumeText(data.text || '');
      } else {
        if (file.type.includes('text')) {
          const txt = await file.text();
          setResumeText(txt);
        } else {
          setResumeText(
            '⚠️ Parsing not available here. Paste your resume text manually or ensure /api/parse-resume is configured.',
          );
        }
      }
    } catch (e) {
      setResumeText('⚠️ Parsing failed. Paste your resume text manually or check the parse API routes.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const handleGenerate = () => {
    const payload: ParsedInputs = { resumeText, jobLink, jobDescription };
    sessionStorage.setItem('jp_inputs', JSON.stringify(payload));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push('/results');
  };

  const charCount = useMemo(() => resumeText.trim().length, [resumeText]);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(59,130,246,0.18),transparent),radial-gradient(800px_400px_at_10%_10%,rgba(34,197,94,0.15),transparent),#0b0e14] text-white">
      <Header />

      <main className="mx-auto max-w-5xl px-4 pt-8 pb-28">
        <section className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Power up my resume!</h1>
          <p className="mt-3 text-white/80">
            Upload your resume, paste a job description or link, then let the AI tailor everything.
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Resume</h2>
              {fileName && <span className="text-xs text-white/70">{fileName}</span>}
            </div>

            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              htmlFor="resume-file"
              className="block cursor-pointer rounded-2xl border-2 border-dashed border-white/20 hover:border-white/30 transition p-6 text-center"
            >
              <div className="text-6xl mb-2">📄</div>
              <div className="font-medium">Drop PDF/DOCX/TXT here or click to upload</div>
              <div className="text-sm text-white/70 mt-1">Max ~5MB</div>
              <input
                ref={fileInputRef}
                id="resume-file"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </label>

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Or paste your resume here…"
              className="mt-4 w-full h-56 rounded-2xl bg-black/40 border border-white/10 p-3 outline-none"
            />
            <div className="mt-2 text-xs text-white/70">{charCount.toLocaleString()} characters</div>
            {uploading && <div className="mt-2 text-sm text-white/80 animate-pulse">Parsing…</div>}
          </div>

          {/* Job inputs */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <h2 className="text-lg font-semibold mb-3">Target job</h2>
            <label className="block text-sm text-white/80 mb-1">Job link (optional)</label>
            <input
              value={jobLink}
              onChange={(e) => setJobLink(e.target.value)}
              placeholder="https://company.com/careers/awesome-role"
              className="w-full rounded-xl bg-black/40 border border-white/10 p-3 outline-none"
            />

            <label className="block text-sm text-white/80 mt-4 mb-1">Job description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description…"
              className="w-full h-56 rounded-2xl bg-black/40 border border-white/10 p-3 outline-none"
            />
          </div>
        </section>

        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={handleGenerate}
            disabled={!resumeText.trim() || !jobDescription.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Generate
          </button>
        </div>
      </main>

      <footer className="fixed bottom-3 inset-x-0">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center text-[11px] text-white/60">
            Job PowerUp • {APP_VERSION}
          </div>
        </div>
      </footer>
    </div>
  );
}
