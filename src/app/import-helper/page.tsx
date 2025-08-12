"use client";

export default function ImportHelper() {
  const bookmarklet = `javascript:(()=>{try{const kill='script,style,noscript,svg,iframe';document.querySelectorAll(kill).forEach(n=>n.remove());const title=(document.title||'').trim();const body=(document.body&&document.body.innerText||'').replace(/\\s{2,}/g,' ').trim();const payload='[[[TITLE]]]\\n'+title+'\\n[[[CONTENT]]]\\n'+body;navigator.clipboard.writeText(payload).then(()=>{alert('✅ Copied job text to clipboard. Return to Job PowerUp and paste into the Job Description box.');}).catch(e=>{alert('Copy failed: '+e);});}catch(e){alert('Extraction error: '+e.message);}})();`;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold mb-3">Import Helper (Bookmarklet)</h1>
      <ol className="list-decimal pl-6 space-y-2 text-sm">
        <li>Drag the button below to your bookmarks bar.</li>
        <li>Open the job posting page.</li>
        <li>Click the bookmarklet; it copies the job text to your clipboard.</li>
        <li>Come back and paste into the Job Description box.</li>
      </ol>
      <div className="mt-6">
        <a href={bookmarklet} className="inline-block rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700">
          Job PowerUp Import
        </a>
      </div>
      <p className="mt-4 text-xs text-gray-600">
        If the page lazy‑loads, scroll once and click the bookmarklet again.
      </p>
    </main>
  );
}
