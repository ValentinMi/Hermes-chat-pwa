import { Store } from "@tanstack/store";
import {
  loadConversations,
  loadSettings,
  saveConversations,
  saveSettings,
} from "@/lib/db";
import type {
  Conversation,
  ConversationsState,
  Settings,
  UIMessage,
} from "./types";

const DEFAULT_SETTINGS: Settings = {
  model: "hermes-4",
  temperature: 0.7,
  reasoning: false,
  systemPrompt: "",
};

export const conversationsStore = new Store<ConversationsState>({
  conversations: [],
  activeId: null,
});

export const settingsStore = new Store<Settings>(DEFAULT_SETTINGS);

const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/* --------------------------- Hydratation --------------------------- */

let hydrated = false;

export async function hydrateStores(defaultModel?: string): Promise<void> {
  if (hydrated) return;
  hydrated = true;

  const [conv, settings] = await Promise.all([loadConversations(), loadSettings()]);
  if (conv) conversationsStore.setState(() => conv);
  settingsStore.setState((prev) => ({
    ...prev,
    ...settings,
    model: settings?.model ?? defaultModel ?? prev.model,
  }));

  // Persistance (débounce léger pour éviter d'écrire à chaque token).
  let convTimer: ReturnType<typeof setTimeout> | undefined;
  conversationsStore.subscribe(() => {
    clearTimeout(convTimer);
    convTimer = setTimeout(() => void saveConversations(conversationsStore.state), 400);
  });
  settingsStore.subscribe(() => void saveSettings(settingsStore.state));
}

/* ----------------------- Actions conversations --------------------- */

function patch(updater: (s: ConversationsState) => ConversationsState) {
  conversationsStore.setState(updater);
}

function updateConversation(
  id: string,
  fn: (c: Conversation) => Conversation,
): void {
  patch((s) => ({
    ...s,
    conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)),
  }));
}

export function newConversation(): string {
  const id = uid();
  const now = Date.now();
  patch((s) => ({
    activeId: id,
    conversations: [
      { id, title: "Nouvelle conversation", createdAt: now, updatedAt: now, messages: [] },
      ...s.conversations,
    ],
  }));
  return id;
}

export function setActive(id: string): void {
  patch((s) => ({ ...s, activeId: id }));
}

export function deleteConversation(id: string): void {
  patch((s) => {
    const conversations = s.conversations.filter((c) => c.id !== id);
    const activeId =
      s.activeId === id ? (conversations[0]?.id ?? null) : s.activeId;
    return { conversations, activeId };
  });
}

export function renameConversation(id: string, title: string): void {
  updateConversation(id, (c) => ({ ...c, title: title.trim() || c.title }));
}

export function getActiveConversation(): Conversation | undefined {
  const { conversations, activeId } = conversationsStore.state;
  return conversations.find((c) => c.id === activeId);
}

export function addMessage(convId: string, msg: Omit<UIMessage, "id" | "createdAt"> & Partial<Pick<UIMessage, "id">>): string {
  const id = msg.id ?? uid();
  updateConversation(convId, (c) => {
    const isFirstUser = c.messages.length === 0 && msg.role === "user";
    return {
      ...c,
      updatedAt: Date.now(),
      // Le titre dérive du premier message utilisateur.
      title: isFirstUser ? deriveTitle(msg.content) : c.title,
      messages: [...c.messages, { ...msg, id, createdAt: Date.now() }],
    };
  });
  return id;
}

export function updateMessage(
  convId: string,
  msgId: string,
  fn: (m: UIMessage) => UIMessage,
): void {
  updateConversation(convId, (c) => ({
    ...c,
    updatedAt: Date.now(),
    messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)),
  }));
}

function deriveTitle(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 48)}…` : t || "Nouvelle conversation";
}
