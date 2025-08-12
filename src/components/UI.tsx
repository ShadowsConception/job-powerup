export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="h2">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }
) {
  const { variant = "ghost", className = "", ...rest } = props;
  return <button {...rest} className={`btn ${variant === "primary" ? "btn-primary" : "btn-ghost"} ${className}`} />;
}
