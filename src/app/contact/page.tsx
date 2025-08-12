export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      <p className="mb-6">Questions, feedback, or partnership ideas? We’d love to hear from you.</p>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <p>Email: <a href="mailto:hello@example.com" className="underline">hello@example.com</a></p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          We usually respond within 1–2 business days.
        </p>
      </div>
    </main>
  );
}
