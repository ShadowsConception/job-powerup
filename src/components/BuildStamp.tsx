"use client";

export default function BuildStamp({ className = "" }: { className?: string }) {
  const sha = (process.env.NEXT_PUBLIC_COMMIT_SHA || "").slice(0, 7) || "dev";
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV || "";
  return (
    <span className={`whitespace-nowrap font-mono text-xs text-gray-400 dark:text-gray-500 ${className}`}>
      Build: {sha}{env && env !== "production" ? ` (${env})` : ""}
    </span>
  );
}
