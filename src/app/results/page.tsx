"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";

type QuizItem = { question: string; idealAnswer?: string };
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

// text helpers (remove quotes; allow **bold**/*italic*; lists; paragraphs)
function stripWrappingQuotes(s: string) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("“") && t.endsWith("”"))) return t.slice(1, -1).trim();
  return s;
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function renderBasicMarkdown(md: string) {
  let html = escapeHtml(md);
  html = html.replace(/^##\s+(.+)$/gm, "<h3 class='mt-4 mb-2 font-semibold'>$1</h3>");
  html = html.replace(/^#\s+(.+)$/gm, "<h2 class='mt-4 mb-2 font-bold text-lg'>$1</h2>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^(?:-|\*)\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul class='list-disc pl-6 space-y-1'>$1</ul>");
  html = html.replace(/\n{2,}/g, "</p><p>");
  return `<p>${html}</p>`;
}

// Copy helper
async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
    return true;
  } catch { return false; }
}

/** —— Assistant bubble preserved from previous version (already good) —— */
function AssistantBubble({ context }: { context: Partial<ResultsPayload> & { resumeText?: string } }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("jp_seen_chat_hint");
    if (!seen) setShowHint(true);
  }, []);

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
      const reply = data?.reply || "Sorry—I'm not sure. Could you rephrase?";
      setMessages([...nextMsgs, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...nextMsgs, { role: "assistant", content: "Network hiccup — try again?" }]);
    } finally {
      setBusy(false);
    }
  }

  function onOpen() {
    setOpen(true);
    if (showHint) {
      setShowHint(false);
      localStorage.setItem("jp_seen_chat_hint", "1");
    }
  }

  return (
    <>
      {!open && (
        <>
          <button
            onClick={onOpen}
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg p-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 text-white"
            aria-label="Open Job PowerUp chat"
            title="Chat with Job PowerUp"
          >
            💬
          </button>
          {showHint && (
            <div className="fixed bottom-20 right-6 z-50 text-xs rounded-xl px-3 py-2 bg-gray-900 text-white shadow-lg">
              Chat with Job PowerUp →
            </div>
          )}
        </>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(90vw,380px)] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 text-white">
            <div className="font-semibold">Job PowerUp Bot</div>
            <button onClick={() => setOpen(false)} className="opacity-90 hover:opacity-100">✕</button>
          </div>

          <div className="h-72 overflow-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Ask me to refine your resume bullets, tailor the cover letter, or quiz you on the job description.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-sm flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-7 w-7 rounded-full grid place-items-center ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"}`}>
                    {m.role === "user" ? "🙂" : "🤖"}
                  </div>
                  <div
                    className={[
                      "rounded-2xl px-3 py-2",
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                    ].join(" ")}
                    dangerouslySetInnerHTML={{ __html: m.role === "assistant" ? renderBasicMarkdown(m.content) : escapeHtml(m.content) }}
                  />
                </div>
              </div>
            ))}
            {busy && (
              <div className="text-sm flex justify-start">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full grid place-items-center bg-emerald-600 text-white">🤖</div>
                  <div className="rounded-2xl px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:120ms] ml-1" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:240ms] ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ask anything about this job…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && send()}
            />
            <button
              onClick={send}
              disabled={busy}
              className="rounded-xl px-3 py-2 text-sm text-white bg-gray-900 hover:bg-black disabled:opacity-50"
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<"improve" | "cover" | "quiz">("improve");
  const [improvements, setImprovements] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [loadingMoreQuiz, setLoadingMoreQuiz] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resumeFilename, setResumeFilename] = useState("");
  const [resumeText, setResumeText] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [jobDescriptionChars, setJobDescriptionChars] = useState(0);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const btnPrimary = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 hover:from-indigo-700 hover:via-violet-700 hover:to-emerald-700 active:scale-[.99] disabled:opacity-50";
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
      const t = sessionStorage.getItem("jp_import_title");
      if (t && t.trim()) setJobTitle(t.trim());
      const rt = sessionStorage.getItem("jp_resume_text");
      if (rt) setResumeText(rt);
      const toast = sessionStorage.getItem("jp_toast");
      if (toast) { setToastMsg(toast); sessionStorage.removeItem("jp_toast"); }
    } catch {}
  }, []);

  useEffect(() => {
    function onScroll() { setShowTop(window.scrollY > 420); }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const title = useMemo(() => (resumeFilename ? `Results for ${resumeFilename}` : "Your Results"), [resumeFilename]);

  async function downloadDocx(title: string, body: string) {
    if (!body?.trim()) return;
    try {
      setDownloading(true);
      const res = await fetch("/api/export-docx", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sections: [{ heading: title, body }] }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `${title.replace(/[^\w.-]+/g, "_").toLowerCase()}.docx`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setToastMsg("DOCX downloaded 📄");
    } catch { setToastMsg("Export failed"); } finally { setDownloading(false); }
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
    } catch { setToastMsg("Couldn't refresh questions"); } finally { setLoadingMoreQuiz(false); }
  }

  // flashcards small helpers
  function nextCard() { if (!quiz.length) return; setDirection(1); setShowAnswer(false); setQuizIdx((i) => (i + 1) % quiz.length); }
  function prevCard() { if (!quiz.length) return; setDirection(-1); setShowAnswer(false); setQuizIdx((i) => (i - 1 + quiz.length) % quiz.length); }

  // empty state
  if (!improvements && !coverLetter && !quiz.length) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900">
        <Header showAuth={false} />
        <main className="flex-1 grid place-items-center">
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
      <Header showAuth={false} />

      {/* Title */}
      <div className="mx-auto max-w-4xl px-6 pt-10 pb-4 text-center">
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
                { id: "quiz", label: "Interview Questions" },
              ].map((t) => {
                const active = activeTab === (t.id as any);
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={[
                      "px-4 py-2 text-sm rounded-xl transition-colors",
                      active
                        ? "text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600"
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
            {/* Improvements (non-editable, formatted) */}
            {activeTab === "improve" && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">How to Improve Your Resume</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => setToastMsg((await copyToClipboard(improvements)) ? "Copied 👍" : "Copy failed")}
                      className={btnGhost}
                      disabled={!improvements.trim()}
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => downloadDocx("resume-improvements", improvements)}
                      className={btnPrimary}
                      disabled={!improvements.trim() || downloading}
                    >
                      {downloading ? <span className="inline-flex items-center"><Spinner />Saving…</span> : "Save as DOCX"}
                    </button>
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <div
                    className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-950 leading-7"
                    dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(improvements) }}
                  />
                </div>
              </div>
            )}

            {/* Cover Letter (non-editable, formatted) */}
            {activeTab === "cover" && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cover Letter</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => setToastMsg((await copyToClipboard(coverLetter)) ? "Copied 👍" : "Copy failed")}
                      className={btnGhost}
                      disabled={!coverLetter.trim()}
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => downloadDocx("cover-letter", coverLetter)}
                      className={btnPrimary}
                      disabled={!coverLetter.trim() || downloading}
                    >
                      {downloading ? <span className="inline-flex items-center"><Spinner />Saving…</span> : "Save as DOCX"}
                    </button>
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <div
                    className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-950 leading-7"
                    dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(coverLetter) }}
                  />
                </div>
              </div>
            )}

            {/* Interview */}
            {activeTab === "quiz" && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Interview Questions</h2>
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
                          <span key={i} className={["inline-block h-2 w-2 rounded-full", i === quizIdx ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-700"].join(" ")} />
                        ))}
                      </div>
                    </div>

                    <div
                      key={`${quizIdx}-${showAnswer}`}
                      className="p-5 md:p-6 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm"
                    >
                      <p className="font-medium text-gray-900 dark:text-gray-100">{quiz[quizIdx].question}</p>
                      {showAnswer && (
                        <p className="mt-3 text-gray-800 dark:text-gray-200 leading-relaxed">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-200 text-amber-900 dark:bg-amber-300 dark:text-amber-900 mr-2 text-xs">Ideal</span>
                          {quiz[quizIdx].idealAnswer || "—"}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={() => { setShowAnswer(false); setDirection(-1); setQuizIdx((i) => (i - 1 + quiz.length) % quiz.length); }} className={btnGhost}>◀ Prev</button>
                      <button onClick={() => setShowAnswer((s) => !s)} className={btnGhost}>
                        {showAnswer ? "Hide Ideal Answer" : "Show Ideal Answer"}
                      </button>
                      <button onClick={() => { setShowAnswer(false); setDirection(1); setQuizIdx((i) => (i + 1) % quiz.length); }} className={btnGhost}>Next ▶</button>
                    </div>

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Tip: use ← / → to switch, press “A” to toggle answer.</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="h-16" />
        </div>
      </main>

      {/* Centered back-to-top arrow */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full h-10 w-10 grid place-items-center border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow"
          title="Back to top"
        >
          ↑
        </button>
      )}

      {/* Chat bubble with full context */}
      <AssistantBubble
        context={{
          improvements,
          coverLetter,
          jobDescription: (JSON.parse(sessionStorage.getItem("jp_results") || "{}")?.jobDescription) || "",
          resumeFilename,
          resumeText,
        }}
      />

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

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
}
