import { PropsWithChildren } from "react";

export default function Container({ children }: PropsWithChildren) {
  return <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>;
}
