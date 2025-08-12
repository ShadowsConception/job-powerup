import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { keyword, location } = await req.json();

  // TODO: replace with Adzuna/SerpAPI later
  const results = [
    { id: "demo1", title: "Software Engineer I", company: "Acme", location: "Remote" },
    { id: "demo2", title: "Frontend Developer", company: "Contoso", location: "NYC" },
  ];

  return NextResponse.json({ results, echo: { keyword, location } });
}
