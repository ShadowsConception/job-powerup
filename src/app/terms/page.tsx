"use client";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <h2>Use of Service</h2>
      <p>
        Job PowerUp provides tools to analyze résumés and job descriptions. You are responsible for the content you
        upload and for complying with applicable laws.
      </p>
      <h2>No Guarantees</h2>
      <p>
        Outputs may contain errors and are provided “as is.” We do not guarantee employment results or the accuracy of
        AI-generated content.
      </p>
      <h2>Acceptable Use</h2>
      <ul>
        <li>No unlawful, infringing, or harmful content</li>
        <li>No attempts to disrupt, reverse engineer, or overload the service</li>
      </ul>
      <h2>Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, we will not be liable for indirect, incidental, or consequential damages
        arising from your use of the service.
      </p>
      <h2>Changes</h2>
      <p>We may update these Terms from time to time. Continued use constitutes acceptance of the updated Terms.</p>
      <h2>Contact</h2>
      <p>Questions? <a href="/contact">Contact us</a>.</p>
    </main>
  );
}
