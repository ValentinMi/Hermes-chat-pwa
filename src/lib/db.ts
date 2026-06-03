import { get, set } from "idb-keyval";
import type { ConversationsState, Settings } from "@/store/types";

const CONV_KEY = "hermes:conversations";
const SETTINGS_KEY = "hermes:settings";

export async function loadConversations(): Promise<ConversationsState | undefined> {
  return get<ConversationsState>(CONV_KEY);
}

export async function saveConversations(state: ConversationsState): Promise<void> {
  await set(CONV_KEY, state);
}

export async function loadSettings(): Promise<Settings | undefined> {
  return get<Settings>(SETTINGS_KEY);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await set(SETTINGS_KEY, settings);
}
