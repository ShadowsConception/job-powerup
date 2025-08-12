"use client";

import { useState } from "react";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // If you add an API route later, send it there.
    // For now just show a success message.
    setSent(true);
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Contact</h1>
      {!sent ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            required
            placeholder="How can we help?"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="w-full h-40 border border-gray-300 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full rounded-xl px-5 py-3 font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-green-300/40 dark:border-green-700/40 bg-green-50 dark:bg-green-900/20 p-6">
          <p className="text-green-800 dark:text-green-200 font-medium">Thanks! We’ll get back to you soon.</p>
        </div>
      )}
    </main>
  );
}
