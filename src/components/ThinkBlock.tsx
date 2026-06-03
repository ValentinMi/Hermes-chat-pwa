import { Markdown } from "./Markdown";

export function ThinkBlock({ think, streaming }: { think: string; streaming?: boolean }) {
  return (
    <details className="think" open={streaming}>
      <summary>
        <span className="think-icon">✦</span> Raisonnement
        {streaming ? <span className="think-live"> · en cours…</span> : null}
      </summary>
      <div className="think-body">
        <Markdown>{think}</Markdown>
      </div>
    </details>
  );
}
