import type { UIToolCall } from "@/store/types";

function pretty(args: string): string {
  try {
    return JSON.stringify(JSON.parse(args), null, 2);
  } catch {
    return args; // arguments encore partiels pendant le streaming
  }
}

export function ToolCallBlock({ toolCalls }: { toolCalls: UIToolCall[] }) {
  return (
    <div className="toolcalls">
      {toolCalls.map((tc, i) => (
        <div className="toolcall" key={tc.id || i}>
          <div className="toolcall-head">
            <span className="toolcall-icon">⚙</span>
            <code>{tc.name || "fonction"}</code>
          </div>
          {tc.arguments ? <pre className="toolcall-args">{pretty(tc.arguments)}</pre> : null}
        </div>
      ))}
    </div>
  );
}
