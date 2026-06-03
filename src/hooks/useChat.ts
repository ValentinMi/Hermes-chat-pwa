import { useCallback, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { streamChat } from "@/lib/api";
import { parseAssistant } from "@/lib/parse";
import type { ChatMessage } from "@shared/types";
import {
  addMessage,
  conversationsStore,
  newConversation,
  settingsStore,
  updateMessage,
} from "@/store";
import type { Conversation, UIToolCall } from "@/store/types";

function buildApiMessages(conv: Conversation, systemPrompt: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  if (systemPrompt.trim()) {
    messages.push({ role: "system", content: systemPrompt.trim() });
  }
  for (const m of conv.messages) {
    if (m.error) continue;
    messages.push({ role: m.role, content: m.content });
  }
  return messages;
}

export function useChat() {
  const settings = useStore(settingsStore);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      // Conversation active, créée à la volée si besoin.
      let convId = conversationsStore.state.activeId;
      if (!convId || !conversationsStore.state.conversations.some((c) => c.id === convId)) {
        convId = newConversation();
      }

      addMessage(convId, { role: "user", content });

      const conv = conversationsStore.state.conversations.find((c) => c.id === convId);
      if (!conv) return;
      const apiMessages = buildApiMessages(conv, settings.systemPrompt);

      const assistantId = addMessage(convId, {
        role: "assistant",
        content: "",
        streaming: true,
      });

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      let raw = "";
      let reasoning = "";
      const toolAcc: UIToolCall[] = [];

      try {
        for await (const chunk of streamChat(
          {
            model: settings.model,
            messages: apiMessages,
            temperature: settings.temperature,
            reasoning: settings.reasoning,
          },
          controller.signal,
        )) {
          if (chunk.reasoning_content) reasoning += chunk.reasoning_content;
          if (chunk.content) raw += chunk.content;

          if (chunk.tool_calls) {
            for (const tc of chunk.tool_calls) {
              const slot = (toolAcc[tc.index] ??= { id: "", name: "", arguments: "" });
              if (tc.id) slot.id = tc.id;
              if (tc.function?.name) slot.name = tc.function.name;
              if (tc.function?.arguments) slot.arguments += tc.function.arguments;
            }
          }

          // Le raisonnement peut venir du champ dédié OU des balises <think>.
          const parsed = parseAssistant(raw);
          const think = reasoning || parsed.think;
          updateMessage(convId, assistantId, (m) => ({
            ...m,
            content: parsed.content,
            think: think || undefined,
            toolCalls: toolAcc.length ? toolAcc.filter(Boolean) : undefined,
            streaming: true,
          }));
        }

        const parsed = parseAssistant(raw);
        updateMessage(convId, assistantId, (m) => ({
          ...m,
          content: parsed.content,
          think: (reasoning || parsed.think) || undefined,
          toolCalls: toolAcc.length ? toolAcc.filter(Boolean) : undefined,
          streaming: false,
        }));
      } catch (err) {
        const aborted = controller.signal.aborted;
        updateMessage(convId, assistantId, (m) => ({
          ...m,
          streaming: false,
          error: aborted ? undefined : (err as Error).message,
          content: m.content || (aborted ? "_(interrompu)_" : ""),
        }));
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [isStreaming, settings],
  );

  return { send, stop, isStreaming };
}
