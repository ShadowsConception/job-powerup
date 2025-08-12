import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job PowerUp",
  description: "Generate resume improvements, cover letters, and interview questions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pre-hydration theme script to avoid flash and honor saved preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var saved = localStorage.getItem('jp_theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch(e){}
})();
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
