"use client";

import React, { useEffect, useRef, useState } from "react";

export const dynamic = "force-dynamic"; // avoid any accidental static caching

type QuizItem = { question: string; idealAnswer: string };
type ChatMessage = { role: "user" | "assistant"; content: string };

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
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="rounded-xl bg-gray-900 text-white px-4 py-3 shadow-lg">{message}</div>
    </div>
  );
}

export default function ResultsPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState<"improve" | "cover" | "quiz">("improve");

  // Data
  const [improvements, setImprovements] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [resumeFilename, setResumeFilename] = useState("");
  const [jobDescriptionChars, setJobDescriptionChars] = useState(0);
  const [jobTitle, setJobTitle] = useState<string | null>(null);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // UI
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load results payload
    try {
      const raw = sessionStorage.getItem("jp_results");
      if (raw) {
        const parsed = JSON.parse(raw);
        setImprovements(parsed.improvements || "");
        setCoverLetter(parsed.coverLetter || "");
        setQuiz(Array.isArray(parsed.quizItems) ? parsed.quizItems : []);
        setResumeFilename(parsed.resumeFilename || "");
        setJobDescriptionChars((parsed.jobDescription || "").length || 0);
      }
    } catch {}
    // Toast from previous page
    const toast = sessionStorage.getItem("jp_toast");
    if (toast) {
      setToastMsg(toast);
      sessionStorage.removeItem("jp_toast");
    }
    // Imported title if available
    const t = sessionStorage.getItem("jp_import_title");
    if (t && t.trim()) setJobTitle(t.trim());

    // Chat history + one-time “tip” bubble
    try {
      const rawMsgs = sessionStorage.getItem("jp_chat_msgs");
      if (rawMsgs) {
        const parsed = JSON.parse(rawMsgs) as ChatMessage[];
        if (Array.isArray(parsed)) {
          setMessages(
            parsed.filter(
              (m) =>
                m &&
                (m.role === "user" || m.role === "assistant") &&
                typeof m.content === "string"
            )
          );
        }
      }
    } catch {}
    const tipSeen = localStorage.getItem("jp_chat_tip_seen");
    if (!tipSeen) {
      setShowTip(true);
    }
  }, []);

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Formatting helpers (render readable cards instead of gray textareas)
  function withBold(text: string) {
    const parts = text.split("**");
    return parts.map((chunk, i) =>
      i % 2 === 1 ? (
        <strong key={i}>{chunk}</strong>
      ) : (
        <React.Fragment key={i}>{chunk}</React.Fragment>
      )
    );
  }
  function renderRichText(md: string) {
    if (!md?.trim()) return null;
    const blocks = md.replace(/\r\n/g, "\n").replace(/\u00A0/g, " ").trim().split(/\n{2,}/);
    return blocks.map((block, idx) => {
      const lines = block.split("\n").filter(Boolean);
      const isBullets = lines.length > 1 && lines.every((l) => /^(\-|\*|•)\s+/.test(l));
      if (isBullets) {
        return (
          <ul key={idx} className="list-disc pl-6 space-y-1">
            {lines.map((l, li) => (
              <li key={li} className="leading-relaxed">
                {withBold(l.replace(/^(\-|\*|•)\s+/, ""))}
              </li>
            ))}
          </ul>
        );
      }
      // Headings
      if (/^##\s+/.test(block)) {
        return (
          <h3 key={idx} className="font-semibold text-lg mt-3">
            {block.replace(/^##\s+/, "")}
          </h3>
        );
      }
      if (/^#\s+/.test(block)) {
        return (
          <h2 key={idx} className="font-bold text-xl mt-3">
            {block.replace(/^#\s+/, "")}
          </h2>
        );
      }
      return (
        <p key={idx} className="leading-relaxed">
          {withBold(lines.join(" "))}
        </p>
      );
    });
  }

  async function copyToClipboard(text: string) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setToastMsg("Copied to clipboard 👍");
    } catch {
      alert("Couldn’t copy to clipboard.");
    }
  }

  async function downloadDocx(title: string, body: string) {
    try {
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sections: [{ heading: title, body }] }),
      });
      if (!res.ok) throw new Error("docx export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setToastMsg("DOCX downloaded ✅");
    } catch (e) {
      console.error(e);
      alert("DOCX export failed.");
    }
  }

  // Chat send
  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    const nextMsgs: ChatMessage[] = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMsgs);
    setInput("");

    try {
      setBusy(true);

      // context for the assistant
      const rawResults = sessionStorage.getItem("jp_results");
      let jobDescription = "";
      let resumeText = sessionStorage.getItem("jp_resume_text") || "";
      if (rawResults) {
        try {
          jobDescription = JSON.parse(rawResults)?.jobDescription || "";
        } catch {}
      }

      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // keep roles literal to prevent TS widening
          messages: nextMsgs,
          jobDescription,
          resumeText,
        }),
      });

      const data = await res.json();
      const ai = String(data?.reply || "");
      const finalMsgs: ChatMessage[] = [...nextMsgs, { role: "assistant" as const, content: ai }];
      setMessages(finalMsgs);
      sessionStorage.setItem("jp_chat_msgs", JSON.stringify(finalMsgs));
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry—something went wrong. Feel free to try again. I’ll be honest but kind, and stick to properly formatted resume guidance.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // UI styles
  const btnTab =
    "px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 backdrop-blur dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-800 active:scale-[.99] text-sm md:text-base";
  const card =
    "bg-white dark:bg-gray-950 rounded-2xl shadow p-5 md:p-6 border border-gray-200 dark:border-gray-800";
  const headerBtn =
    "px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black text-sm md:text-base";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900">
      {/* Transparent header reused styling */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-transparent/50 backdrop-blur supports-[backdrop-filter]:bg-transparent/45">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
          <a href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Job PowerUp
          </a>
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

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Centered top block */}
        <section className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Your Results{jobTitle ? ` — ${jobTitle}` : ""}
          </h1>
          <div className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
            {jobTitle ? `Job: ${jobTitle}` : "Switch tabs to view each artifact."}{" "}
            <span className="text-gray-400 dark:text-gray-500">
              {`Job description chars: ${jobDescriptionChars.toLocaleString()}`}
            </span>
            {resumeFilename && (
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                Source resume: {resumeFilename}
              </span>
            )}
          </div>

          {/* Download both */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => downloadDocx("Resume Improvements", improvements)}
              disabled={!improvements.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Download Improvements DOCX
            </button>
            <button
              onClick={() => downloadDocx("Cover Letter", coverLetter)}
              disabled={!coverLetter.trim()}
              className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-50"
            >
              Download Cover Letter DOCX
            </button>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setActiveTab("improve")}
            className={`${btnTab} ${
              activeTab === "improve"
                ? "border-indigo-300 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40"
                : ""
            }`}
            aria-current={activeTab === "improve" ? "page" : undefined}
          >
            How to improve your resume
          </button>
          <button
            onClick={() => setActiveTab("cover")}
            className={`${btnTab} ${
              activeTab === "cover"
                ? "border-fuchsia-300 dark:border-fuchsia-800 bg-fuchsia-50/70 dark:bg-fuchsia-950/40"
                : ""
            }`}
            aria-current={activeTab === "cover" ? "page" : undefined}
          >
            Cover Letter
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`${btnTab} ${
              activeTab === "quiz"
                ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30"
                : ""
            }`}
            aria-current={activeTab === "quiz" ? "page" : undefined}
          >
            Interview Questions
          </button>
        </div>

        {/* Panels */}
        <section ref={panelRef} className={card}>
          {activeTab === "improve" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  How to improve your resume
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {improvements.length.toLocaleString()} chars
                  </span>
                  <button
                    onClick={() => copyToClipboard(improvements)}
                    disabled={!improvements.trim()}
                    className={headerBtn}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="prose prose-gray max-w-none dark:prose-invert prose-p:leading-relaxed prose-li:leading-relaxed">
                {renderRichText(improvements)}
              </div>
            </div>
          )}

          {activeTab === "cover" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cover Letter</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {coverLetter.length.toLocaleString()} chars
                  </span>
                  <button
                    onClick={() => copyToClipboard(coverLetter)}
                    disabled={!coverLetter.trim()}
                    className={headerBtn}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Nicely formatted letter: paragraphs & line spacing */}
              <div className="space-y-3 leading-relaxed">
                {renderRichText(coverLetter)}
              </div>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Interview Questions
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      // re-generate with same JD context
                      const raw = sessionStorage.getItem("jp_results");
                      let jobDescription = "";
                      if (raw) {
                        try {
                          jobDescription = JSON.parse(raw)?.jobDescription || "";
                        } catch {}
                      }
                      if (!jobDescription.trim()) {
                        alert("Missing job description. Go back and generate again.");
                        return;
                      }
                      try {
                        const res = await fetch("/api/interview-quiz", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ jobDescription, count: 10 }),
                        });
                        const data = await res.json();
                        const items: QuizItem[] = Array.isArray(data.items) ? data.items : [];
                        setQuiz(items);
                        setQuizIdx(0);
                        setShowAnswer(false);
                        setToastMsg("New questions generated 🔄");
                      } catch (e: any) {
                        console.error(e);
                        alert(`Failed to generate questions: ${e.message || e}`);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50 inline-flex items-center"
                  >
                    Generate More (Replace)
                  </button>
                </div>
              </div>

              {quiz.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No questions yet. Click “Generate More (Replace)”.
                </p>
              ) : (
                <>
                  <div className="flex items-baseline justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Question {quizIdx + 1} of {quiz.length}
                    </span>
                  </div>
                  <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{quiz[quizIdx].question}</p>
                    {showAnswer && (
                      <p className="mt-3 text-gray-800 dark:text-gray-200 leading-relaxed">
                        <span className="font-semibold">Ideal answer: </span>
                        {quiz[quizIdx].idealAnswer}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAnswer((s) => !s)}
                      className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[.99]"
                    >
                      {showAnswer ? "Hide Answer" : "Show Answer"}
                    </button>
                    <button
                      onClick={() => {
                        setShowAnswer(false);
                        setQuizIdx((i) => (i + 1 < quiz.length ? i + 1 : 0));
                      }}
                      className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[.99]"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Chat bubble (bottom-right) + theme pebble (bottom-left) */}
      <button
        onClick={() => {
          setChatOpen((v) => !v);
          if (!localStorage.getItem("jp_chat_tip_seen")) {
            localStorage.setItem("jp_chat_tip_seen", "1");
            setShowTip(false);
          }
        }}
        className="fixed bottom-6 right-6 z-40 rounded-full p-3 shadow-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:from-indigo-700 hover:to-fuchsia-700"
        aria-label="Chat with Job PowerUp"
        title="Chat with Job PowerUp"
      >
        💬
      </button>

      {showTip && !chatOpen && (
        <div className="fixed bottom-[5.5rem] right-6 z-40 rounded-xl bg-gray-900 text-white text-sm px-3 py-2 shadow">
          Chat with Job PowerUp →
        </div>
      )}

      {/* Theme pebble bottom-left */}
      <ThemePebble />

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[min(92vw,28rem)] max-h-[70vh] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="font-semibold">Job PowerUp Bot</div>
            <button onClick={() => setChatOpen(false)} className="text-sm text-gray-500 hover:text-gray-900">
              ✕
            </button>
          </div>
          <div className="p-3 overflow-y-auto flex-1 space-y-3">
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500">
                Ask anything about your resume or the job—I'll be honest, kind, and format answers cleanly.
              </div>
            ) : null}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 ml-12"
                    : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mr-12"
                }`}
              >
                {renderRichText(m.content)}
              </div>
            ))}
            {busy && (
              <div className="rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mr-12 inline-flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:0.2s]" />
                </span>
                thinking…
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask for feedback or edits…"
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-xl px-3 py-2 bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center"
            >
              {busy ? <Spinner /> : null}
              {busy ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      )}

      {/* Footer with build badge (optional) */}
      <footer className="bg-gray-100/60 dark:bg-gray-950/60 border-t border-gray-200 dark:border-gray-800 py-6 mt-10">
        <div className="mx-auto max-w-4xl px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div className="text-gray-700 dark:text-gray-300 text-center md:text-left">
            © {new Date().getFullYear()} Job PowerUp. All rights reserved.
            <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
              Build: {process.env.NEXT_PUBLIC_COMMIT_SHA?.slice(0, 7) || "dev"}
            </span>
          </div>
          <nav className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <a href="/privacy" className="hover:underline">
              Privacy
            </a>
            <a href="/terms" className="hover:underline">
              Terms
            </a>
            <a href="/contact" className="hover:underline">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Small floating theme toggle pebble (bottom-left) */
function ThemePebble() {
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
      className="fixed bottom-6 left-6 z-40 rounded-full px-3 py-2 bg-gray-900 text-white hover:bg-black"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
