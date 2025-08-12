import Link from "next/link";
import Container from "@/components/Container";

export default function Landing() {
  return (
    <Container>
      <h1 className="text-3xl font-bold">Job Application Power-Up</h1>
      <p className="mt-2 text-lg opacity-80">
        Paste a job link, upload your résumé, and get a tailored résumé, cover letter, and interview kit.
      </p>
      <div className="mt-6">
        <Link href="/dashboard" className="rounded-lg border px-4 py-2 hover:shadow">
          Go to Dashboard
        </Link>
      </div>
    </Container>
  );
}
