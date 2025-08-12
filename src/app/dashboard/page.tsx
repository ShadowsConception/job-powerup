"use client";

import { useState } from "react";
import Container from "@/components/Container";

type Job = {
  id: string;
  title: string;
  company?: string;
  location?: string;
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: "demo1", title: "Software Engineer I", company: "Acme", location: "Remote" },
    { id: "demo2", title: "Frontend Developer", company: "Contoso", location: "NYC" },
  ]);

  return (
    <Container>
      <h2 className="text-2xl font-semibold">Find a Job</h2>

      <form
        className="mt-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const inputs = form.querySelectorAll("input");
          const keyword = (inputs[0] as HTMLInputElement).value.trim();
          const location = (inputs[1] as HTMLInputElement).value.trim();

          try {
            const res = await fetch("/api/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ keyword, location }),
            });

            if (!res.ok) {
              throw new Error(`Search failed: ${res.status}`);
            }

            const data = await res.json();
            setJobs(data.results as Job[]);
          } catch (err) {
            console.error(err);
            alert("Search error. Try again in a moment.");
          }
        }}
      >
        <input
          className="w-64 rounded border px-3 py-2"
          placeholder="Keyword (e.g., React)"
          aria-label="Keyword"
        />
        <input
          className="w-48 rounded border px-3 py-2"
          placeholder="Location (optional)"
          aria-label="Location"
        />
        <button className="rounded border px-4 py-2">Search</button>
      </form>

      <div className="mt-6 grid gap-3">
        {jobs.map((j) => (
          <button
            key={j.id}
            className="w-full text-left rounded-xl border p-4 hover:shadow"
            onClick={() => (window.location.href = `/job/${j.id}`)}
          >
            <div className="text-lg font-semibold">{j.title}</div>
            <div className="text-sm opacity-80">
              {j.company ?? "Unknown"} • {j.location ?? "Remote/Unknown"}
            </div>
          </button>
        ))}
      </div>
    </Container>
  );
}
