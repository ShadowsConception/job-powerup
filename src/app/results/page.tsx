"use client";

import React, { useEffect, useMemo, useState } from "react";

type QuizItem = { question: string; answer?: string };
type ResultsPayload = {
  improvements: string;
  coverLetter: string;
  quizItems: QuizItem[];
  jobDescription: string;
  resumeFilename: string;
};

function Spinner({ className = "h-4 w-4 mr-2" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
}

function ThemeToggle() {
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
      className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

export default function ResultsPage() {
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [active, setActive] = useState<"improve" | "cover" | "quiz">("improve");
  const [regen, setRegen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("jp_results");
      if (!raw) return;
      const parsed: ResultsPayload = JSON.parse(raw);
      setData(parsed);
    } catch {
      // ignore
    }
  }, []);

  const title = useMemo(() => {
    if (!data?.resumeFilename) return "Your Results";
    return `Results for ${data.resumeFilename}`;
  }, [data]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {
      alert("Could not copy.");
    }
  }

  async function regenerateQuestions() {
    if (!data?.jobDescription) return;
    try {
      setRegen(true);
      const res = await fetch("/api/interview-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: data.jobDescription, count: 10 }),
      });
      const body = await res.json().catch(() => ({}));
      const items = Array.isArray(body?.items) ? body.items : [];
      const next: ResultsPayload = { ...data, quizItems: items };
      setData(next);
      sessionStorage.setItem("jp_results", JSON.stringify(next));
    } catch {
      alert("Couldn't generate more questions.");
    } finally {
      setRegen(false);
    }
  }

  async function downloadDocx() {
    if (!data) return;
    try {
      setDownloading(true);
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = (data.resumeFilename || "resume").replace(/[^\w.-]+/g, "_");
      a.download = `${base.replace(/\.[^.]+$/, "")}-job-powerup.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Couldn't export DOCX.");
    } finally {
      setDownloading(false);
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900">
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <a href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">Job PowerUp</a>
            <div className="flex items-center gap-2"><ThemeToggle /></div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">No results yet</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Upload a resume and job description to generate results.</p>
            <a href="/" className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              Back to edit
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <a href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Job PowerUp
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-xl px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back to edit
            </a>
            <button
              onClick={downloadDocx}
              className="rounded-xl px-3 py-1.5 text-sm text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700"
              disabled={downloading}
            >
              {downloading ? "Preparing…" : "Download as DOCX"}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto max-w-4xl px-6 pt-10 pb-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tailored improvements, a cover letter, and interview practice based on your target role.
        </p>
      </div>

      {/* Tabs */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mx-auto mb-6 flex w-full items-center justify-center">
            <div className="inline-flex rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-1 shadow-sm">
              {[
                { id: "improve", label: "Resume Improvements" },
                { id: "cover", label: "Cover Letter" },
                { id: "quiz", label: "Interview Qs" },
              ].map((t) => {
                const isActive = active === (t.id as any);
                return (
                  <button
                    key={t.id}
                    onClick={() => setActive(t.id as any)}
                    className={[
                      "px-4 py-2 text-sm rounded-xl transition-colors",
                      isActive
                        ? "text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panels */}
          <section className="space-y-6">
            {/* Improvements */}
            {active === "improve" && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    What to improve for this job — <span className="font-semibold">in your resume</span>
                  </h2>
                  <button
                    onClick={() => copy(data.improvements)}
                    className="text-sm rounded-lg px-3 py-1.5 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Copy
                  </button>
                </div>
                <Article text={data.improvements} />
                <Disclosure title="Job description (reference)">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{data.jobDescription}</pre>
                </Disclosure>
              </div>
            )}

            {/* Cover Letter */}
            {active === "cover" && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cover Letter draft</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copy(data.coverLetter)}
                      className="text-sm rounded-lg px-3 py-1.5 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <Article text={data.coverLetter} />
              </div>
            )}

            {/* Interview Questions */}
            {active === "quiz" && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Interview practice</h2>
                  <button
                    onClick={regenerateQuestions}
                    disabled={regen}
                    className="text-sm rounded-lg px-3 py-1.5 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {regen ? <span className="inline-flex items-center"><Spinner />Generating…</span> : "Generate more"}
                  </button>
                </div>
                {data.quizItems?.length ? (
                  <ol className="space-y-4 list-decimal pl-5">
                    {data.quizItems.map((q, i) => (
                      <li key={i} className="text-gray-900 dark:text-gray-100">
                        <div className="font-medium">{q.question}</div>
                        {q.answer && (
                          <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                            <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 mr-1">Tip</span>
                            {q.answer}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No questions yet.</p>
                )}
              </div>
            )}
          </section>

          <div className="h-12" />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-6 mt-10">
        <div className="mx-auto max-w-4xl px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div className="text-gray-700 dark:text-gray-300 text-center md:text-left">
            © {new Date().getFullYear()} Job PowerUp. All rights reserved.
          </div>
          <nav className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Simple readable article block that respects line breaks/bullets */
function Article({ text }: { text: string }) {
  if (!text?.trim()) return <p className="text-gray-600 dark:text-gray-400">No content.</p>;
  return (
    <div className="prose dark:prose-invert max-w-none">
      <pre className="whitespace-pre-wrap font-sans leading-relaxed text-gray-900 dark:text-gray-100">{text}</pre>
    </div>
  );
}

/** Minimal disclosure/accordion */
function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        {open ? "Hide" : "Show"} {title}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
