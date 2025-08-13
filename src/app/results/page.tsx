'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Inputs = {
  resumeText: string;
  jobLink: string;
  jobDescription: string;
};

type AnalyzeOut = {
  summary: string;
  improvements: string; // “What to improve in your resume for this job”
  tailoredBullets?: string;
};

type CoverLetterOut = { coverLetter: string };

type QuizItem = { question: string; answer: string };
type QuizOut = { questions: QuizItem[] };

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

export default function ResultsPage() {
  const router = useRouter();
  const [inputs, setInputs] = useState<Inputs | null>(null);

  // outputs + loading/error states
  const [analyze, setAnalyze] = useState<AnalyzeOut | null>(null);
  const [analyzeErr, setAnalyzeErr] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  const [letter, setLetter] = useState<CoverLetterOut | null>(null);
  const [letterErr, setLetterErr] = useState<string | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);

  const [quiz, setQuiz] = useState<QuizOut | null>(null);
  const [quizErr, setQuizErr] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'analyze' | 'letter' | 'quiz'>('analyze');

  useEffect(() => {
    // safe read after mount
    try {
      const raw = sessionStorage.getItem('jp_inputs');
      if (raw) {
        const parsed = JSON.parse(raw) as Inputs;
        setInputs(parsed);
      } else {
        setInputs(null);
      }
    } catch {
      setInputs(null);
    }
  }, []);

  useEffect(() => {
    if (!inputs) return;
    // kick off all three in parallel
    (async () => {
      setAnalyzeLoading(true);
      setLetterLoading(true);
      setQuizLoading(true);
      try {
        const [a, l, q] = await Promise.allSettled([
          postJSON<AnalyzeOut>('/api/analyze', inputs),
          postJSON<CoverLetterOut>('/api/cover-letter', inputs),
          postJSON<QuizOut>('/api/interview-quiz', inputs),
        ]);

        if (a.status === 'fulfilled') setAnalyze(a.value);
        else setAnalyzeErr(a.reason?.message || 'Analyze failed');

        if (l.status === 'fulfilled') setLetter(l.value);
        else setLetterErr(l.reason?.message || 'Cover letter failed');

        if (q.status === 'fulfilled') setQuiz(q.value);
        else setQuizErr(q.reason?.message || 'Quiz failed');
      } finally {
        setAnalyzeLoading(false);
        setLetterLoading(false);
        setQuizLoading(false);
      }
    })();
  }, [inputs]);

  const resumeChars = useMemo(() => inputs?.resumeText?.length ?? 0, [inputs]);

  const backToEdit = () => {
    router.push('/');
  };

  const regenerateQuiz = async () => {
    if (!inputs) return;
    setQuizLoading(true);
    setQuizErr(null);
    try {
      const fresh = await postJSON<QuizOut>('/api/interview-quiz', inputs);
      setQuiz(fresh);
    } catch (e: any) {
      setQuizErr(e?.message || 'Could not generate more questions');
    } finally {
      setQuizLoading(false);
    }
  };

  const downloadDocx = async () => {
    try {
      const payload = {
        analyze,
        letter,
        quiz,
        inputs,
      };
      const res = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'job-powerup.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('DOCX export is not configured on this deployment.');
    }
  };

  if (inputs === null) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0b0e14] text-white">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">No inputs found</div>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2 rounded-xl bg-white text-black font-semibold"
          >
            Back to edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(59,130,246,0.18),transparent),radial-gradient(800px_400px_at_10%_10%,rgba(34,197,94,0.15),transparent),#0b0e14] text-white">
      {/* Header */}
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-indigo-400 grid place-items-center shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24" className="fill-white">
              <path d="M2 5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H9l-5 5v-5H5a3 3 0 0 1-3-3V5z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">Job PowerUp</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={backToEdit}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90"
          >
            Back to edit
          </button>
          <button
            onClick={downloadDocx}
            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10"
          >
            Download DOCX
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-2 rounded-2xl bg-white/5 border border-white/10 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 rounded-xl ${
              activeTab === 'analyze' ? 'bg-white text-black font-semibold' : 'hover:bg-white/10'
            }`}
          >
            Resume Powerups
          </button>
          <button
            onClick={() => setActiveTab('letter')}
            className={`px-4 py-2 rounded-xl ${
              activeTab === 'letter' ? 'bg-white text-black font-semibold' : 'hover:bg-white/10'
            }`}
          >
            Cover Letter
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-xl ${
              activeTab === 'quiz' ? 'bg-white text-black font-semibold' : 'hover:bg-white/10'
            }`}
          >
            Interview Q&A
          </button>
        </div>

        {/* Panels */}
        <div className="mt-4">
          {activeTab === 'analyze' && (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5">
              {analyzeLoading && <div className="animate-pulse">Generating tailored resume guidance…</div>}
              {analyzeErr && <div className="text-red-300">Error: {analyzeErr}</div>}
              {analyze && (
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold">Summary</h3>
                    <p className="mt-1 whitespace-pre-wrap text-white/90">{analyze.summary}</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-semibold">What to improve in your resume for this job</h3>
                    <p className="mt-1 whitespace-pre-wrap text-white/90">{analyze.improvements}</p>
                  </section>
                  {analyze.tailoredBullets && (
                    <section>
                      <h3 className="text-lg font-semibold">Tailored bullet points</h3>
                      <p className="mt-1 whitespace-pre-wrap text-white/90">{analyze.tailoredBullets}</p>
                    </section>
                  )}
                  <div className="text-xs text-white/60">
                    Source resume length: {resumeChars.toLocaleString()} characters
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'letter' && (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5">
              {letterLoading && <div className="animate-pulse">Drafting cover letter…</div>}
              {letterErr && <div className="text-red-300">Error: {letterErr}</div>}
              {letter && (
                <textarea
                  defaultValue={letter.coverLetter}
                  className="w-full h-[60vh] rounded-2xl bg-black/40 border border-white/10 p-3 outline-none"
                />
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Interview practice</h3>
                <button
                  onClick={regenerateQuiz}
                  disabled={quizLoading}
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {quizLoading ? 'Generating…' : 'Generate more'}
                </button>
              </div>
              {quizErr && <div className="text-red-300 mt-2">Error: {quizErr}</div>}
              {!quiz && quizLoading && <div className="mt-2 animate-pulse">Loading questions…</div>}
              {quiz && (
                <ol className="mt-4 space-y-4 list-decimal pl-5">
                  {quiz.questions.map((q, i) => (
                    <li key={i} className="space-y-2">
                      <div className="font-medium">{q.question}</div>
                      <div className="text-white/90 whitespace-pre-wrap">{q.answer}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center text-[11px] text-white/60">Job PowerUp • results</div>
        </div>
      </footer>
    </div>
  );
}
