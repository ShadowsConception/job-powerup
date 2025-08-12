"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/** ========= Types ========= */
type QuizItem = { question: string; idealAnswer?: string };
type ResultsPayload = {
  improvements: string;
  coverLetter: string;
  quizItems: QuizItem[];
  jobDescription: string;
  resumeFilename: string;
};

/** ========= Small UI bits ========= */
function Spinner({ className = "h-4 w-4 mr-2" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="rounded-xl bg-gray-900 text-white px-4 py-3 shadow-lg">{message}</div>
    </div>
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

/** ========= Header (matches landing; no login/sign-up/back) ========= */
function Header({
  toolsOpen, helpOpen, openWithCancel, closeWithDelay,
}: {
  toolsOpen: boolean;
  helpOpen: boolean;
  openWithCancel: (which: "tools" | "help") => void;
  closeWithDelay: (which: "tools" | "help") => void;
}) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
        <a href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          Job PowerUp
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm relative">
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
                className="absolute left-0 mt-2 w-52 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg p-2"
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
                className="absolute left-0 mt-2 w-52 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg p-2"
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

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** ========= Markdown helpers ========= */
function stripWrappingQuotes(s: string) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("“") && t.endsWith("”"))) {
    return t.slice(1, -1).trim();
  }
  return s;
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function renderBasicMarkdown(md: string) {
  // very light renderer: **bold**, *italic*, lists, line breaks
  let html = escapeHtml(md);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // bullets
  html = html.replace(/^(?:-|\*)\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  // paragraphs
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = `<p>${html}</p>`;
  return html;
}

/** ========= Chat bubble ========= */
function AssistantBubble({ context }: { context: Partial<ResultsPayload> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    const nextMsgs = [...messages, { role: "user", content: text }];
    setMessages(nextMsgs);
    setInput("");
    try {
      setBusy(true);
      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMsgs, context }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = data?.reply || "Sorry, I couldn't think of anything useful 😅";
      setMessages([...nextMsgs, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...nextMsgs, { role: "assistant", content: "Network hiccup — try again?" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg p-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white"
          aria-label="Open Job PowerUp chat"
          title="Chat with Job PowerUp"
        >
          💬
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(90vw,380px)] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Job PowerUp Bot</div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">✕</button>
          </div>
          <div className="h-72 overflow-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Ask me to refine your resume bullets, tailor the cover letter, or quiz you on the job description.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : ""}`}>
                <div
                  className={[
                    "inline-block rounded-2xl px-3 py-2",
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                  ].join(" ")}
                  dangerouslySetInnerHTML={{ __html: m.role === "assistant" ? renderBasicMarkdown(m.content) : escapeHtml(m.content) }}
                />
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ask anything about this job…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && send()}
            />
            <button onClick={send} disabled={busy} className="rounded-xl px-3 py-2 text-sm text-white bg-gray-900 hover:bg-black disabled:opacity-50">
              {busy ? <span className="inline-flex items-center"><Spinner />Send…</span> : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** ========= Page ========= */
export default function ResultsPage() {
  // Header dropdowns
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
    t.current = window.setTimeout(() => { (which === "tools" ? setToolsOpen : setHelpOpen)(false); }, 180);
  };

  // Data + UI
  const [activeTab, setActiveTab] = useState<"improve" | "cover" | "quiz">("improve");
  const [improvements, setImprovements] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [previewImprove, setPreviewImprove] = useState(false);
  const [previewCover, setPreviewCover] = useState(false);

  const [loadingMoreQuiz, setLoadingMoreQuiz] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resumeFilename, setResumeFilename] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [jobDescriptionChars, setJobDescriptionChars] = useState(0);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);

  const [improveDirty, setImproveDirty] = useState(false);
  const [coverDirty, setCoverDirty] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const prevTabRef = useRef<"improve" | "cover" | "quiz">("improve");
  const saveTimerRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Buttons (higher contrast)
  const btnPrimary = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 active:scale-[.99] disabled:opacity-50";
  const btnDark = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm text-white bg-gray-900 hover:bg-black active:scale-[.99] disabled:opacity-50";
  const btnGhost = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[.99]";

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("jp_results");
      if (raw) {
        const parsed: ResultsPayload = JSON.parse(raw);
        setImprovements(stripWrappingQuotes(parsed.improvements || ""));
        setCoverLetter(stripWrappingQuotes(parsed.coverLetter || ""));
        setQuiz(Array.isArray(parsed.quizItems) ? parsed.quizItems : []);
        setResumeFilename(parsed.resumeFilename || "");
        setJobDescriptionChars((parsed.jobDescription || "").length || 0);
      }
      const toast = sessionStorage.getItem("jp_toast");
      if (toast) {
        setToastMsg(toast);
        sessionStorage.removeItem("jp_toast");
      }
      const t = sessionStorage.getItem("jp_import_title");
      if (t && t.trim()) setJobTitle(t.trim());
    } catch {}
  }, []);

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 420);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scheduleSave(field: "improvements" | "coverLetter", value: string) {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const raw = sessionStorage.getItem("jp_results");
      let parsed: any = {};
      try { parsed = raw ? JSON.parse(raw) : {}; } catch {}
      parsed[field] = value;
      sessionStorage.setItem("jp_results", JSON.stringify(parsed));
    }, 350);
  }

  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev !== activeTab) {
      let saved = false;
      if (prev === "improve" && improveDirty) { scheduleSave("improvements", improvements); setImproveDirty(false); saved = true; }
      if (prev === "cover" && coverDirty) { scheduleSave("coverLetter", coverLetter); setCoverDirty(false); saved = true; }
      if (saved) setToastMsg("Saved 💾");
      prevTabRef.current = activeTab;
    }
  }, [activeTab, improvements, coverLetter, improveDirty, coverDirty]);

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setToastMsg("Copied ✅"); }
    catch { setToastMsg("Copy failed"); }
  }

  async function downloadDocx(title: string, body: string) {
    if (!body?.trim()) return;
    try {
      setDownloading(true);
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sections: [{ heading: title, body }] }), // send markdown; API keeps **bold**
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^\w.-]+/g, "_").toLowerCase()}.docx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setToastMsg("DOCX downloaded 📄");
    } catch { setToastMsg("Export failed"); }
    finally { setDownloading(false); }
  }

  async function regenerateQuestions() {
    try {
      setLoadingMoreQuiz(true);
      const raw = sessionStorage.getItem("jp_results");
      const jobDescription = raw ? (JSON.parse(raw)?.jobDescription || "") : "";
      const res = await fetch("/api/interview-quiz", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, count: 10 }),
      });
      const body = await res.json().catch(() => ({}));
      const items = Array.isArray(body?.items) ? body.items : [];
      setQuiz(items); setQuizIdx(0); setShowAnswer(false); setDirection(1);
      setToastMsg("New questions 🔄");
    } catch { setToastMsg("Couldn't refresh questions"); }
    finally { setLoadingMoreQuiz(false); }
  }

  // Flashcard keyboard + swipe
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!quiz.length) return;
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
      if (e.key.toLowerCase() === "a") setShowAnswer((s) => !s);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quiz, quizIdx]);
  function nextCard() { if (!quiz.length) return; setDirection(1); setShowAnswer(false); setQuizIdx((i) => (i + 1) % quiz.length); }
  function prevCard() { if (!quiz.length) return; setDirection(-1); setShowAnswer(false); setQuizIdx((i) => (i - 1 + quiz.length) % quiz.length); }
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.changedTouches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? nextCard() : prevCard(); }
    touchStartX.current = null;
  }

  const title = useMemo(() => (resumeFilename ? `Results for ${resumeFilename}` : "Your Results"), [resumeFilename]);
  const taBase = "w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 md:p-4 text-base leading-relaxed bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y";

  // Empty state
  if (!improvements && !coverLetter && !quiz.length) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900">
        <Header toolsOpen={toolsOpen} helpOpen={helpOpen} openWithCancel={openWithCancel} closeWithDelay={closeWithDelay} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">No results yet</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Upload a resume and job description to generate results.</p>
            <a href="/" className={btnPrimary}>PowerUp my resume</a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900">
      <Header toolsOpen={toolsOpen} helpOpen={helpOpen} openWithCancel={openWithCancel} closeWithDelay={closeWithDelay} />

      {/* Title */}
      <div className="mx-auto max-w-4xl px-6 pt-10 pb-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          {title}{jobTitle ? ` — ${jobTitle}` : ""}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tailored improvements, a cover letter, and interview practice.
          <span className="ml-2 text-gray-400 dark:text-gray-500 text-sm">JD chars: {jobDescriptionChars.toLocaleString()}</span>
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
                { id: "quiz", label: "Interview Questions" }, // ← full text
              ].map((t) => {
                const active = activeTab === (t.id as any);
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={[
                      "px-4 py-2 text-sm rounded-xl transition-colors",
                      active
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

          <div ref={panelRef} className="space-y-6">
            {/* Improvements (editable + preview) */}
            {activeTab === "improve" && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">How to Improve Your Resume</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPreviewImprove((v) => !v)} className={btnGhost}>
                      {previewImprove ? "Edit" : "Preview formatting"}
                    </button>
                    <button onClick={() => copy(improvements)} className={btnDark}>Copy</button>
                    <button
                      onClick={() => downloadDocx("resume-improvements", improvements)}
                      className={btnPrimary}
                      disabled={!improvements.trim() || downloading}
                    >
                      {downloading ? <span className="inline-flex items-center"><Spinner />Saving…</span> : "Save as DOCX"}
                    </button>
                  </div>
                </div>
                {!previewImprove ? (
                  <textarea
                    className={`${taBase} h-[32rem]`}
                    value={improvements}
                    onChange={(e) => { setImprovements(e.target.value); setImproveDirty(true); scheduleSave("improvements", e.target.value); }}
                  />
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900"
                         dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(improvements) }} />
                  </div>
                )}
              </div>
            )}

            {/* Cover Letter (editable + preview) */}
            {activeTab === "cover" && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cover Letter</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPreviewCover((v) => !v)} className={btnGhost}>
                      {previewCover ? "Edit" : "Preview formatting"}
                    </button>
                    <button onClick={() => copy(coverLetter)} className={btnDark}>Copy</button>
                    <button
                      onClick={() => downloadDocx("cover-letter", coverLetter)}
                      className={btnPrimary}
                      disabled={!coverLetter.trim() || downloading}
                    >
                      {downloading ? <span className="inline-flex items-center"><Spinner />Saving…</span> : "Save as DOCX"}
                    </button>
                  </div>
                </div>
                {!previewCover ? (
                  <textarea
                    className={`${taBase} h-[26rem]`}
                    value={coverLetter}
                    onChange={(e) => { setCoverLetter(e.target.value); setCoverDirty(true); scheduleSave("coverLetter", e.target.value); }}
                  />
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900"
                         dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(coverLetter) }} />
                  </div>
                )}
              </div>
            )}

            {/* Interview Flashcards (with swipe + keyboard) */}
            {activeTab === "quiz" && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Interview Practice</h2>
                  <button onClick={regenerateQuestions} disabled={loadingMoreQuiz} className={btnPrimary}>
                    {loadingMoreQuiz ? <span className="inline-flex items-center"><Spinner />Generating…</span> : "Generate More"}
                  </button>
                </div>

                {!quiz.length ? (
                  <p className="text-gray-600 dark:text-gray-400">No questions yet.</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Card {quizIdx + 1} / {quiz.length}</span>
                      <div className="flex gap-1">
                        {quiz.map((_, i) => (
                          <span key={i} className={["inline-block h-2 w-2 rounded-full", i === quizIdx ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"].join(" ")} />
                        ))}
                      </div>
                    </div>

                    <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                      <div
                        key={`${quizIdx}-${showAnswer}`}
                        className={[
                          "p-5 md:p-6 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900 shadow-sm",
                          direction === 1 ? "animate-slideInNext" : "animate-slideInPrev",
                        ].join(" ")}
                      >
                        <p className="font-medium text-gray-900 dark:text-gray-100">{quiz[quizIdx].question}</p>
                        {showAnswer && (
                          <p className="mt-3 text-gray-800 dark:text-gray-200 leading-relaxed">
                            <span className="px-2 py-0.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-2 text-xs">Ideal</span>
                            {quiz[quizIdx].idealAnswer || "—"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={prevCard} className={btnGhost}>◀ Prev</button>
                      <button onClick={() => setShowAnswer((s) => !s)} className={btnDark}>
                        {showAnswer ? "Hide Ideal Answer" : "Show Ideal Answer"}
                      </button>
                      <button onClick={nextCard} className={btnGhost}>Next ▶</button>
                    </div>

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Tip: use ← / → to switch, press “A” to toggle answer.</p>

                    <style jsx>{`
                      @keyframes slideInNext { from { opacity: 0; transform: translateX(18px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
                      @keyframes slideInPrev { from { opacity: 0; transform: translateX(-18px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
                      .animate-slideInNext { animation: slideInNext 220ms ease-out; }
                      .animate-slideInPrev { animation: slideInPrev 220ms ease-out; }
                    `}</style>
                  </>
                )}
              </div>
            )}
          </div>

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

      {/* Back-to-top pill */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 z-40 rounded-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow"
        >
          ↑ Back to top
        </button>
      )}

      {/* Chat bubble (uses OpenAI via /api/assistant-chat) */}
      <AssistantBubble context={{ improvements, coverLetter, jobDescription: "", resumeFilename }} />

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
}
