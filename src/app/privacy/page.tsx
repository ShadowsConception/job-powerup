export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">
        Job PowerUp (“we”, “our”, “us”) respects your privacy. This policy explains what information we collect and how we use it.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Information we collect</h2>
      <ul className="list-disc ml-6 space-y-2">
        <li>Files you upload (e.g., your Resume) to generate results.</li>
        <li>Text you enter (job descriptions, prompts).</li>
        <li>Basic usage data (pages visited, actions) to improve the product.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">How we use information</h2>
      <ul className="list-disc ml-6 space-y-2">
        <li>To provide, maintain, and improve Job PowerUp features.</li>
        <li>To troubleshoot issues and protect against abuse.</li>
        <li>To communicate service updates or important notices.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Data retention</h2>
      <p className="mb-4">
        Uploaded files may be processed temporarily to generate results. We strive to minimize retention and delete files when no longer needed.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Third parties</h2>
      <p className="mb-4">
        We may use reputable vendors (e.g., hosting, analytics) to operate the service. These providers only access data as necessary to perform services for us.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Your choices</h2>
      <p className="mb-4">
        You may contact us to request deletion of your data where applicable. Some information may be retained as required by law or for legitimate business purposes.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
      <p>Questions? Email us at <a className="underline" href="mailto:hello@example.com">hello@example.com</a>.</p>
    </main>
  );
}
