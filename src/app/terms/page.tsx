export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">
        By accessing or using Job PowerUp, you agree to these Terms. If you do not agree, do not use the service.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Use of the service</h2>
      <ul className="list-disc ml-6 space-y-2">
        <li>You are responsible for the content you upload and for complying with applicable laws.</li>
        <li>You will not attempt to misuse, disrupt, or reverse engineer the service.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Intellectual property</h2>
      <p className="mb-4">
        The site’s design, code, and features are owned by us. You retain rights to your own content (e.g., your Resume).
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">No guarantees</h2>
      <p className="mb-4">
        The service is provided “as is” without warranties. We do not guarantee job outcomes or accuracy of generated content.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Limitation of liability</h2>
      <p className="mb-4">
        To the maximum extent permitted by law, we are not liable for indirect or consequential damages arising from your use of the service.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Changes</h2>
      <p className="mb-4">
        We may update these Terms from time to time. Continued use after changes means you accept the revised Terms.
      </p>
    </main>
  );
}
