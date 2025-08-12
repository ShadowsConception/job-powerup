"use client";

import { useEffect, useRef, useState } from "react";

type QuizItem = { question: string; idealAnswer: string };

function Spinner({ className = "h-4 w-4 mr-2" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
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
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("jp_theme") as "light" | "dark") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("jp_theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
    }
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
  const [activeTab, setActiveTab] = useState<"improve" | "cover" | "quiz">("improve");
  const [improvements, setImprovements] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [loadingMoreQuiz, setLoadingMoreQuiz] = useState(false);
  const [resumeFilename, setResumeFilename] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [jobDescriptionChars, setJobDescriptionChars] = useState(0);
  const [jobTitle, setJobTitle] = useState<string | null>(null); // NEW

  const [improveDirty, setImproveDirty] = useState(false);
  const [coverDirty, setCoverDirty] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const prevTabRef = useRef<"improve" | "cover" | "quiz">("improve");
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("jp_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setImprovements(parsed.improvements || "");
        setCoverLetter(parsed.coverLetter || "");
        setQuiz(Array.isArray(parsed.quizItems) ? parsed.quizItems : []);
        setResumeFilename(parsed.resumeFilename || "");
        setJobDescriptionChars((parsed.jobDescription || "").length || 0);
      } catch {}
    }
    const toast = sessionStorage.getItem("jp_toast");
    if (toast) {
      setToastMsg(toast);
      sessionStorage.removeItem("jp_toast");
    }
    // pull imported title if available
    const t = sessionStorage.getItem("jp_import_title");
    if (t && t.trim()) setJobTitle(t.trim());
  }, []);

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  function scheduleSave(field: "improvements" | "coverLetter", value: string) {
    if (typeof window === "undefined") return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const raw = sessionStorage.getItem("jp_results");
      let parsed: any = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {}
      parsed[field] = value;
      sessionStorage.setItem("jp_results", JSON.stringify(parsed));
    }, 400);
  }

  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev !== activeTab) {
      let savedSomething = false;
      if (prev === "improve" && improveDirty) {
        scheduleSave("improvements", improvements);
        setImproveDirty(false);
        savedSomething = true;
      }
      if (prev === "cover" && coverDirty) {
        scheduleSave("coverLetter", coverLetter);
        setCoverDirty(false);
        savedSomething = true;
      }
      if (savedSomething) setToastMsg("Saved! 💾");
      prevTabRef.current = activeTab;
    }
  }, [activeTab, improvements, coverLetter, improveDirty, coverDirty]);

  const btnTab =
    "px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[.99] text-sm md:text-base";
  const isDisabled = (s: string) => !s || s.trim().length === 0;

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

  async function handleGenerateMoreQuiz() {
    if (typeof window === "undefined") return;
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

    setLoadingMoreQuiz(true);
    try {
      const res = await fetch("/api/interview-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, count: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "quiz failed");
      const items: QuizItem[] = Array.isArray(data.items) ? data.items : [];
      setQuiz(items);
      setQuizIdx(0);
      setShowAnswer(false);
      setToastMsg("New questions generated 🔄");
    } catch (e: any) {
      console.error(e);
      alert(`Failed to generate questions: ${e.message || e}`);
    } finally {
      setLoadingMoreQuiz(false);
    }
  }

  const taBase =
    "w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 md:p-4 text-base leading-relaxed bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Your Results{jobTitle ? ` — ${jobTitle}` : ""}
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 line-clamp-1" title={jobTitle || undefined}>
              {jobTitle ? `Job: ${jobTitle}` : "Switch tabs to view each artifact."}{" "}
              <span className="text-gray-400 dark:text-gray-500">
                {`Job description chars: ${jobDescriptionChars.toLocaleString()}`}
              </span>
            </p>
            {resumeFilename && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Source résumé: {resumeFilename}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  const raw = sessionStorage.getItem("jp_results");
                  if (raw) {
                    try {
                      const parsed = JSON.parse(raw);
                      sessionStorage.setItem("jp_resume_jobDescription", parsed.jobDescription || "");
                      sessionStorage.setItem("jp_resume_filename", parsed.resumeFilename || "");
                    } catch {}
                  }
                  // keep jobTitle in storage so it shows on landing again if needed
                  window.location.href = "/";
                }
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm md:text-base"
            >
              Back to Edit
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("improve")}
            className={`${btnTab} ${
              activeTab === "improve" ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800" : ""
            }`}
          >
            Résumé Improvements
          </button>
          <button
            onClick={() => setActiveTab("cover")}
            className={`${btnTab} ${
              activeTab === "cover" ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800" : ""
            }`}
          >
            Cover Letter
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`${btnTab} ${
              activeTab === "quiz" ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800" : ""
            }`}
          >
            Interview Questions
          </button>
        </div>

        {/* Panels */}
        <div
          ref={panelRef}
          className="bg-white dark:bg-gray-950 rounded-2xl shadow p-5 md:p-6 border border-gray-200 dark:border-gray-800"
        >
          {activeTab === "improve" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  What to Improve in Your Résumé for This Job
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{improvements.length.toLocaleString()} chars</span>
                  <button
                    onClick={() => {
                      copyToClipboard(improvements);
                    }}
                    disabled={isDisabled(improvements)}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm disabled:opacity-50"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <textarea
                className={`${taBase} h-[32rem]`}
                value={improvements}
                onChange={(e) => {
                  setImprovements(e.target.value);
                  setImproveDirty(true);
                  scheduleSave("improvements", e.target.value);
                }}
              />
            </div>
          )}

          {activeTab === "cover" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cover Letter</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{coverLetter.length.toLocaleString()} chars</span>
                  <button
                    onClick={() => {
                      copyToClipboard(coverLetter);
                    }}
                    disabled={isDisabled(coverLetter)}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm disabled:opacity-50"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => downloadDocx("Cover Letter", coverLetter)}
                    disabled={isDisabled(coverLetter)}
                    className="px-3 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white text-sm disabled:opacity-50"
                  >
                    Download DOCX
                  </button>
                </div>
              </div>
              <textarea
                className={`${taBase} h-[26rem]`}
                value={coverLetter}
                onChange={(e) => {
                  setCoverLetter(e.target.value);
                  setCoverDirty(true);
                  scheduleSave("coverLetter", e.target.value);
                }}
              />
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Interview Questions</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateMoreQuiz}
                    disabled={loadingMoreQuiz}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50 inline-flex items-center"
                  >
                    {loadingMoreQuiz && <Spinner />}
                    {loadingMoreQuiz ? "Generating…" : "Generate More (Replace)"}
                  </button>
                </div>
              </div>

              {quiz.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No questions yet. Click “Generate More (Replace)”.</p>
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
        </div>
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
}
