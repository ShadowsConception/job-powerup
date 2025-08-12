"use client";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        We only process your uploaded résumé and job description to generate your results. We don’t sell your data.
        Files may be temporarily processed by our servers and AI provider to produce outputs. You can delete your
        data at any time by clearing your browser storage; if you created an account, you can request deletion via{" "}
        <a href="/contact">Contact</a>.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Uploaded files (PDF/DOCX) for parsing</li>
        <li>Job descriptions or links you provide</li>
        <li>Basic usage analytics to improve the product</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>Generate résumé improvements, a cover letter, and interview questions</li>
        <li>Maintain session state (e.g., results) in your browser</li>
        <li>Improve the app’s reliability and UX</li>
      </ul>
      <h2>Your choices</h2>
      <ul>
        <li>Do not upload sensitive personal info you don’t want processed</li>
        <li>Clear your browser storage to remove local data</li>
        <li>Contact us for account data export or deletion</li>
      </ul>
    </main>
  );
}
