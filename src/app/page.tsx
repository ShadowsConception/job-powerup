"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BuildStamp from "../components/BuildStamp";

export const dynamic = "force-dynamic";

function Spinner({ className = "h-4 w-4 mr-2" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();

  // Core state
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [importTitle, setImportTitle] = useState<string | null>(null);

  // UX + progress
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<null | string>(null);

  // Validation
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Import spinner
  const [importing, setImporting] = useState(false);

  // Drag & drop
  const [dragActive, setDragActive] = useState(false);
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0] || null;
    if (f) {
      setFile(f);
      validateSelectedFile(f);
    }
  }

  // Menus with hover-delay
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

  // Footer year + brand
  const currentYear = new Date().getFullYear();
  const BRAND = "Job PowerUp";

  useEffect(() => {
    const jd = sessionStorage.getItem("jp_resume_jobDescription");
    if (jd) setJobDescription(jd);
    const t = sessionStorage.getItem("jp_import_title");
    if (t) setImportTitle(t);
  }, []);

  // Styles
  const inputBase =
    "w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 md:p-4 text-base leading-relaxed bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const taBase =
    "w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 md:p-4 text-base leading-relaxed bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y";
  const btnBase =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  // Import job link
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
      if (!res.ok) throw new Error(data?.error || `Import failed (${res.status}).`);
      const text: string = data?.text || "";
      const title: string | undefined = data?.title;
      if (!text) throw new Error("No readable content found at that link.");
      setJobDescription(text);
      setImportTitle(title || null);
      sessionStorage.setItem("jp_resume_jobDescription", text);
      if (title) sessionStorage.setItem("jp_import_title", title);
      sessionStorage.setItem("jp_toast", "Imported job description from link ✅");
    } catch (e: any) {
      alert(String(e?.message || "Could not import from that link."));
    } finally {
      setImporting(false);
    }
  }

  // Validate immediately + extract for chat
  async function validateSelectedFile(f: File) {
    setValidating(true);
    setValidationError(null);
    setValidated(false);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/validate-resume", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "We couldn't read any text in that file.");
      if (!data?.chars || data.chars < 20) {
        throw new Error("That file appears to have little or no extractable text. Try another resume or export to PDF.");
      }

      // Extract text cache for chat
      try {
        const fd2 = new FormData();
        fd2.append("file", f);
        const res2 = await fetch("/api/parse-resume", { method: "POST", body: fd2 });
        const d2 = await res2.json().catch(() => ({}));
        if (res2.ok && d2?.text) sessionStorage.setItem("jp_resume_text", String(d2.text));
      } catch {}

      setValidated(true);
    } catch (err: any) {
      setValidationError(String(err?.message || "Validation failed."));
      setValidated(false);
    } finally {
      setValidating(false);
    }
  }

  // File input
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) validateSelectedFile(f);
  }

  async function handleGenerateAll() {
    if (!file) return alert("Upload a PDF or DOCX resume first.");
    if (!validated) return alert("Please wait — we’re validating your resume.");
    if (!jobDescription.trim()) return alert("Paste the job description (or import from link) first.");

    setLoading(true);
    setStatus("Starting…");
    setProgress(10);

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
          setProgress(45);
          setStatus("Analyzing resume vs job…");
          return d;
        });

      const coverPromise = fetch("/api/cover-letter", { method: "POST", body: fdCover })
        .then((r) => r.json())
        .then((d) => {
          setProgress(70);
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
          setProgress(90);
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

      setProgress(100);
      setStatus("Done!");
      router.push("/results");
    } catch {
      alert("Something went wrong generating results.");
    } finally {
      setLoading(false);
    }
  }

  const isReadyToGenerate = !loading && !!file && validated && !!jobDescription.trim();

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(80rem_50rem_at_0%_-10%,rgba(99,102,241,0.18),transparent),radial-gradient(90rem_50rem_at_100%_10%,rgba(236,72,153,0.16),transparent)] dark:bg-[radial-gradient(80rem_50rem_at_0%_-10%,rgba(99,102,241,0.16),transparent),radial-gradient(90rem_50rem_at_100%_10%,rgba(236,72,153,0.14),transparent)]">
      {/* Transparent, professional header */}
      <header className="sticky top-0 z-40 bg-white/60 dark:bg-gray-950/40 backdrop-blur-md border-b border-white/40 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          {/* Brand LEFT */}
          <a href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Job PowerUp
          </a>

          <nav className="hidden md:flex items-center gap-10 text-sm relative">
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
                  className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-2"
                  onMouseEnter={() => openWithCancel("tools")}
                  onMouseLeave={() => closeWithDelay("tools")}
                >
                  <a className="block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" href="/">
                    PowerUp My Resume
                  </a>
                  <a className="block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" href="/results">
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
                  className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-2"
                  onMouseEnter={() => openWithCancel("help")}
                  onMouseLeave={() => closeWithDelay("help")}
                >
                  <a className="block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" href="/privacy">
                    Privacy
                  </a>
                  <a className="block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" href="/terms">
                    Terms
                  </a>
                  <a className="block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" href="/contact">
                    Contact
                  </a>
                </div>
              )}
            </div>
          </nav>

          {/* Auth RIGHT — white text */}
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
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 pt-12 pb-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            PowerUp My Resume
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload a resume, then add a job description to generate tailored outputs.
          </p>
        </div>

        {/* Upload card with DnD */}
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl shadow-lg p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Upload Your Resume (PDF or DOCX)</h2>

            <div
              className={[
                "rounded-2xl border-2 border-dashed",
                dragActive ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30" : "border-gray-300 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40",
                "p-10 md:p-12 text-center transition-colors",
              ].join(" ")}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              role="button"
              aria-label="Upload your resume by clicking or dragging a file here"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && hiddenInputRef.current?.click()}
            >
              <input
                ref={hiddenInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={onFileChange}
                className="hidden"
              />

              <button
                onClick={() => hiddenInputRef.current?.click()}
                disabled={validating}
                className="inline-flex items-center justify-center rounded-xl px-6 md:px-8 py-3 md:py-4 font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 disabled:opacity-60"
              >
                {validating ? <Spinner className="h-5 w-5 mr-2" /> : null}
                {validating ? "Validating…" : "Choose File"}
              </button>

              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">or drag & drop here</div>

              {file?.name && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Selected: <span className="font-medium">{file.name}</span>
                </div>
              )}

              {validationError && (
                <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {validationError}
                </div>
              )}

              <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                By uploading, you agree to our <a className="underline" href="/terms">Terms</a>.
              </p>
            </div>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Max file size 10MB. Supported: PDF, DOCX.
            </p>
          </div>

          {/* Reveal only after validation succeeds */}
          {validated && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Have a job link?</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Using a link? Skip paste.</span>
                </div>
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
                    disabled={!jobUrl.trim() || importing}
                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                  >
                    {importing ? <Spinner /> : null}
                    {importing ? "Importing…" : "Import from link"}
                  </button>
                </div>
                {importTitle && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Imported title:</span> {importTitle}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Job Description</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Paste only if no link.</span>
                </div>
                <textarea
                  className={`${taBase} h-80`}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job posting here… (or import from a link above)"
                />
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  {jobDescription.length.toLocaleString()} characters
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGenerateAll}
                  disabled={!isReadyToGenerate}
                  className={`${btnBase} w-full text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700`}
                >
                {loading && <Spinner />}
                {loading ? "Generating…" : "Generate"}
                </button>

                {loading && (
                  <div className="w-full">
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-center">
                      {status ? `${status} (${Math.min(progress, 100)}%)` : `${Math.min(progress, 100)}%`}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 dark:bg-gray-950/50 backdrop-blur border-t border-white/40 dark:border-white/10 py-6 mt-10">
        <div className="mx-auto max-w-4xl px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div className="text-gray-700 dark:text-gray-300 text-center md:text-left">
            © {currentYear} {BRAND}. All rights reserved. <BuildStamp className="ml-2" />
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
