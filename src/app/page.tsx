"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

// ===== NEW: paste cleaning helpers =====
const BOTWALL_PATTERNS = /(just a moment|cloudflare|additional verification required|ray id|captcha)/i;

function parseBookmarkletPayload(raw: string) {
  if (BOTWALL_PATTERNS.test(raw)) return { title: "", text: "", blocked: true };

  // Our bookmarklet format [[[TITLE]]]/[[[CONTENT]]]
  const tIdx = raw.indexOf("[[[TITLE]]]");
  const cIdx = raw.indexOf("[[[CONTENT]]]");
  if (tIdx !== -1 && cIdx !== -1) {
    const title = raw.slice(tIdx + 11, cIdx).trim();
    const text = raw.slice(cIdx + 13).replace(/\s{2,}/g, " ").trim();
    return { title, text, blocked: false };
  }

  // r.jina.ai-like markdown
  const mTitle = raw.match(/^Title:\s*(.+)$/m);
  let body = raw;
  const mark = raw.indexOf("Markdown Content:");
  if (mark >= 0) body = raw.slice(mark + "Markdown Content:".length);
  body = body
    .replace(/^URL Source:.*$/gmi, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const title = (mTitle?.[1] || "").trim();
  return { title, text: body, blocked: false };
}
// ======================================

export default function LandingPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [importTitle, setImportTitle] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<null | string>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Footer year + brand
  const currentYear = new Date().getFullYear();
  const BRAND = "Job PowerUp"; // change if you want a company name here

  useEffect(() => {
    const jd = sessionStorage.getItem("jp_resume_jobDescription");
    if (jd) setJobDescription(jd);
    const t = sessionStorage.getItem("jp_import_title");
    if (t) setImportTitle(t);
  }, []);

  function startProgress() {
    setProgress(5);
    stopProgress();
    progressTimerRef.current = window.setInterval(() => {
      setProgress((p) => (p < 90 ? p + 1 : p));
    }, 300);
  }
  function stopProgress() {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }
  function bumpProgress(toAtLeast: number) {
    setProgress((p) => (p < toAtLeast ? toAtLeast : p));
  }

  const inputBase =
    "w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 md:p-4 text-base leading-relaxed bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const taBase =
    "w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 md:p-4 text-base leading-relaxed bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y";
  const btnBase =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  async function importFromLink() {
    if (!jobUrl.trim()) {
      alert("Paste a job posting link first.");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/job-from-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Import failed (${res.status}).`);
      }
      const text: string = data?.text || "";
      const title: string | undefined = data?.title;
      if (!text) throw new Error("No readable content found at that link.");
      setJobDescription(text);
      setImportTitle(title || null);
      sessionStorage.setItem("jp_resume_jobDescription", text);
      if (title) sessionStorage.setItem("jp_import_title", title);
      sessionStorage.setItem(
        "jp_toast",
        data?.via === "proxy" ? "Imported via proxy (site blocked direct fetch) ✅" : "Imported job description from link ✅"
      );
    } catch (e: any) {
      console.error(e);
      const msg = String(e?.message || "Could not import from that link.");
      const hint =
        msg.includes("blocking automated access") || msg.includes("451")
          ? "\n\nThis site blocks server import. Use the bookmarklet at /import-helper, then paste here."
          : "";
      alert(msg + hint);
    } finally {
      setImporting(false);
    }
  }

  // ===== NEW: on-paste cleaner =====
  function handlePasteClean(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const raw = e.clipboardData.getData("text/plain");
    if (!raw) return;
    const { title, text, blocked } = parseBookmarkletPayload(raw);
    if (blocked) {
      e.preventDefault();
      alert("This looks like a Cloudflare/anti‑bot page. Use the bookmarklet on the actual job posting, then paste here.");
      return;
    }
    const looksStructured = /\[\[\[CONTENT]]]/.test(raw) || /^Title:/m.test(raw) || raw.length > 5000;
    if (looksStructured) {
      e.preventDefault();
      if (title) {
        setImportTitle(title);
        sessionStorage.setItem("jp_import_title", title);
      }
      setJobDescription(text);
      sessionStorage.setItem("jp_resume_jobDescription", text);
      sessionStorage.setItem("jp_toast", "Cleaned pasted job description ✅");
    }
  }
  // =================================

  async function handleGenerateAll() {
    if (!file) return alert("Upload a PDF or DOCX résumé first.");
    if (!jobDescription.trim()) return alert("Paste the job description (or import from link) first.");

    setLoading(true);
    setStatus("Starting…");
    startProgress();

    try {
      const fdAnalyze = new FormData();
      fdAnalyze.append("file", file);
      fdAnalyze.append("jobDescription", jobDescription);

      const fdCover = new FormData();
      fdCover.append("file", file);
      fdCover.append("jobDescription", jobDescription);

      const analyzePromise = fetch("/api/analyze", { method: "POST", body: fdAnalyze })
        .then((r) => r.json())
        .then((d) => {
          bumpProgress(35);
          setStatus("Analyzing résumé vs job…");
          return d;
        });

      const coverPromise = fetch("/api/cover-letter", { method: "POST", body: fdCover })
        .then((r) => r.json())
        .then((d) => {
          bumpProgress(65);
          setStatus("Drafting cover letter…");
          return d;
        });

      const quizPromise = fetch("/api/interview-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, count: 10 }),
      })
        .then((r) => r.json())
        .then((d) => {
          bumpProgress(90);
          setStatus("Building interview questions…");
          return d;
        });

      const [improveData, coverData, quizData] = await Promise.all([analyzePromise, coverPromise, quizPromise]);

      const payload = {
        improvements: improveData?.improvements || "",
        coverLetter: coverData?.coverLetter || "",
        quizItems: Array.isArray(quizData?.items) ? quizData.items : [],
        jobDescription,
        resumeFilename: file.name || "",
      };

      sessionStorage.setItem("jp_results", JSON.stringify(payload));
      sessionStorage.setItem("jp_resume_jobDescription", jobDescription);
      sessionStorage.setItem("jp_resume_filename", file.name || "");
      sessionStorage.setItem("jp_toast", "Your results are ready! ✨");

      bumpProgress(100);
      setStatus("Done!");
      stopProgress();

      router.push("/results");
    } catch (e) {
      console.error(e);
      stopProgress();
      setProgress(0);
      setStatus(null);
      alert("Something went wrong generating results.");
    } finally {
      setLoading(false);
    }
  }

  const isReadyToGenerate = !loading && !!file && !!jobDescription.trim();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900">
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">Job PowerUp</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Upload your résumé, paste a job description, or import from a link — then generate tailored outputs.
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Centered card */}
          <div className="mx-auto max-w-2xl bg-white dark:bg-gray-950 rounded-3xl shadow-lg p-6 md:p-8 space-y-6 border border-gray-200 dark:border-gray-800">
            {/* Upload */}
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Upload Your Résumé (PDF or DOCX)</h2>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className={inputBase}
              />
              {file?.name && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Selected: {file.name}</div>}
            </div>

            {/* Import from link */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Have a job link?</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className={`${inputBase} flex-1`}
                  placeholder="https://careers.company.com/job/12345"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  type="url"
                  inputMode="url"
                />
                <button
                  onClick={importFromLink}
                  disabled={importing || !jobUrl.trim()}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                >
                  {importing && <Spinner />}
                  {importing ? "Importing…" : "Import from link"}
                </button>
              </div>
              {importTitle && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Imported title:</span> {importTitle}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If a site blocks import, use the <a href="/import-helper" className="underline">bookmarklet</a> and paste here.
              </p>
            </div>

            {/* JD textarea */}
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Job Description</h2>
              <textarea
                className={`${taBase} h-72`}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                onPaste={handlePasteClean}   // <-- NEW
                placeholder="Paste the full job posting here… (or import from a link above)"
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                {jobDescription.length.toLocaleString()} characters
              </div>
            </div>

            {/* Generate + Progress */}
            <div className="space-y-3">
              <button
                onClick={handleGenerateAll}
                disabled={!isReadyToGenerate}
                className={`${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 w-full`}
                title={!file ? "Upload a résumé to enable" : !jobDescription.trim() ? "Paste a job description to enable" : "Generate results"}
              >
                {loading && <Spinner />}
                {loading ? "Generating…" : "Generate"}
              </button>

              {loading && (
                <div className="w-full">
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-center">
                    {status ? `${status} (${Math.min(progress, 100)}%)` : `${Math.min(progress, 100)}%`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast is handled on results page after redirect */}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-6">
        <div className="mx-auto max-w-4xl px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div className="text-gray-700 dark:text-gray-300 text-center md:text-left">
            © {currentYear} {BRAND}. All rights reserved.
          </div>
          <nav className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="mailto:hello@example.com" className="hover:underline">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
