"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert("Login is not implemented yet — coming soon!");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white dark:bg-gray-950 rounded-3xl shadow-lg p-8 border border-gray-200 dark:border-gray-800 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Log in</h1>
        <input className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-gray-100"
               type="email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-gray-100"
               type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="w-full rounded-xl px-5 py-3 font-medium bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">Log in</button>
        <p className="text-sm text-gray-500 dark:text-gray-400">No account? <a href="/signup" className="underline">Sign up</a></p>
      </form>
    </div>
  );
}
