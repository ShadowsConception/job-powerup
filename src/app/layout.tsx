// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import FloatThemeToggle from "@/components/FloatThemeToggle";

export const metadata: Metadata = {
  title: "Job PowerUp",
  description: "Tailor your resume, cover letter, and interview prep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Global header on all pages */}
        <Header showAuth />

        {/* Page content */}
        {children}

        {/* One global bottom-left theme toggle */}
        <FloatThemeToggle />
      </body>
    </html>
  );
}
