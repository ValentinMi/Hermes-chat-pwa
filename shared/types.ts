// Types partagés entre le client (PWA) et le serveur proxy (Hono).

export type Role = "system" | "user" | "assistant" | "tool";

/** Appel d'outil au format OpenAI/Hermes. */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON encodé sous forme de string
  };
}

/** Message tel qu'envoyé à l'API compatible OpenAI. */
export interface ChatMessage {
  role: Role;
  content: string;
  /** Présent sur les messages assistant qui déclenchent des outils. */
  tool_calls?: ToolCall[];
  /** Présent sur les messages role="tool" (réponse d'un outil). */
  tool_call_id?: string;
  name?: string;
}

/** Corps de la requête POST /api/chat envoyée par la PWA. */
export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  /** Active le mode raisonnement (balises <think>) côté Hermes 4 si supporté. */
  reasoning?: boolean;
}

/** Un modèle renvoyé par GET /api/models. */
export interface ModelInfo {
  id: string;
}

export interface SessionStatus {
  authenticated: boolean;
}
