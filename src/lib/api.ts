import type { ChatRequest, ModelInfo, SessionStatus } from "@shared/types";

/** Delta d'un chunk SSE (format OpenAI/Hermes). */
export interface DeltaChunk {
  content?: string;
  /** Certains serveurs vLLM séparent le raisonnement dans ce champ. */
  reasoning_content?: string;
  tool_calls?: Array<{
    index: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }>;
  finish_reason?: string | null;
}

export async function getSession(): Promise<SessionStatus> {
  const res = await fetch("/api/session");
  return res.json();
}

export async function login(password: string): Promise<void> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Échec de la connexion.");
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST" });
}

export async function getModels(): Promise<{ data: ModelInfo[]; default: string }> {
  const res = await fetch("/api/models");
  if (!res.ok) throw new Error("Impossible de charger les modèles.");
  return res.json();
}

/**
 * Lance une requête de chat et émet les deltas au fil du stream SSE.
 * Lève une erreur si l'API renvoie autre chose qu'un flux d'événements.
 */
export async function* streamChat(
  req: ChatRequest,
  signal: AbortSignal,
): AsyncGenerator<DeltaChunk> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erreur ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Les événements SSE sont séparés par une ligne vide.
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      for (const line of rawEvent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const choice = json.choices?.[0];
          if (!choice) continue;
          const delta = choice.delta ?? {};
          yield {
            content: delta.content ?? undefined,
            reasoning_content: delta.reasoning_content ?? undefined,
            tool_calls: delta.tool_calls ?? undefined,
            finish_reason: choice.finish_reason ?? undefined,
          };
        } catch {
          // Chunk partiel/non-JSON : on ignore.
        }
      }
    }
  }
}
