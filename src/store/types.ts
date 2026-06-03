export interface UIToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Bloc de raisonnement Hermes 4 (replié dans l'UI). */
  think?: string;
  /** Outils invoqués par l'assistant. */
  toolCalls?: UIToolCall[];
  /** Renseigné si la génération a échoué. */
  error?: string;
  /** Vrai tant que le message est en cours de streaming. */
  streaming?: boolean;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
}

export interface Settings {
  model: string;
  temperature: number;
  reasoning: boolean;
  systemPrompt: string;
}

export interface ConversationsState {
  conversations: Conversation[];
  activeId: string | null;
}
