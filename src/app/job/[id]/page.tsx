"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Container from "@/components/Container";
import { Section, Button } from "@/components/UI";

export default function JobDetail() {
  const params = useParams();
  const jobId = params.id as string;

  const job = {
    id: jobId,
    title: "Software Engineer I",
    company: "Acme",
    location: "Remote",
    description: "We are seeking a junior engineer with experience in React and Node.",
  };

  const [output, setOutput] = useState<any>(null);
  const [jobDesc, setJobDesc] = useState("");

  async function exportDoc(kind: "resume" | "cover") {
    if (!output) return;
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, job, output }),
    });
    if (!res.ok) { alert("Export failed."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = kind === "resume" ? "Tailored_Resume.docx" : "Cover_Letter.docx";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <h1 className="h1">{job.title}</h1>
        <span className="badge">{job.company} · {job.location}</span>
      </div>
      <p className="small mt-1">ID: {job.id}</p>

      <Section title="Description">
        <p className="whitespace-pre-wrap small">{job.description}</p>
      </Section>

      <form
        className="card mt-6 grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const input = e.currentTarget.querySelector('input[name="resume"]') as HTMLInputElement;
          const file = input?.files?.[0];
          if (!file) { alert("Upload a résumé first."); return; }
          const fd = new FormData();
          fd.append("resume", file);
          fd.append("jobDesc", jobDesc);
          const res = await fetch("/api/generate", { method: "POST", body: fd });
          if (!res.ok) { alert("Generation failed."); return; }
          setOutput(await res.json());
        }}
      >
        <label className="small">Upload your résumé (PDF/DOCX)</label>
        <input name="resume" type="file" accept=".pdf,.doc,.docx" className="rounded border bg-transparent p-2" />

        <label className="small mt-2">Paste the job description (best results)</label>
        <textarea
          className="min-h-[140px] rounded border bg-transparent p-2"
          placeholder="Paste the job listing text here…"
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
        />

        <div className="mt-2 flex gap-2">
          <Button variant="primary" type="submit">Generate Tailored Docs</Button>
        </div>
      </form>

      {output && (
        <div className="mt-8 grid gap-6">
          {output.warnings?.length ? (
            <Section title="Notes">
              <ul className="list-disc pl-6 small">
                {output.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </Section>
          ) : null}

          <Section title="Résumé Summary & Bullets">
            <p className="small whitespace-pre-wrap">{output.resume?.summary}</p>
            <ul className="mt-2 list-disc pl-6">
              {output.resume?.bullets?.map((b: string, i: number) => <li key={i}>{b}</li>)}
            </ul>

            {/* clarified heading */}
            {output.improvements?.length ? (
              <>
                <div className="mt-4 text-base font-semibold">
                  What to improve on your résumé for this job
                </div>
                <ul className="mt-2 list-disc pl-6 small">
                  {output.improvements.map((it: string, i: number) => <li key={i}>{it}</li>)}
                </ul>
              </>
            ) : null}

            <div className="mt-3 flex gap-2">
              <Button variant="primary" onClick={() => exportDoc("resume")}>Download DOCX Résumé</Button>
            </div>
          </Section>

          <Section title="Cover Letter">
            <pre className="small whitespace-pre-wrap">{output.coverLetter}</pre>
            <div className="mt-3 flex gap-2">
              <Button variant="primary" onClick={() => exportDoc("cover")}>Download DOCX Cover Letter</Button>
            </div>
          </Section>

          <Section title="Interview Kit (first 3)">
            <ul className="space-y-4">
              {(output.interviewKit?.questions || []).slice(0, 3).map((q: any, i: number) => (
                <li key={i}>
                  <div className="font-medium">{q.q}</div>
                  <ul className="list-disc pl-6 small">
                    {q.answer_outline?.map((a: string, j: number) => <li key={j}>{a}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Parsed Résumé Preview">
            <pre className="small whitespace-pre-wrap">{output.parsedResumePreview}</pre>
          </Section>
        </div>
      )}
    </Container>
  );
}
