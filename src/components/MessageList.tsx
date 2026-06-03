import { useEffect, useRef } from "react";
import { Message } from "./Message";
import type { Conversation } from "@/store/types";

export function MessageList({ conversation }: { conversation: Conversation | undefined }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const count = conversation?.messages.length ?? 0;
  const lastLen = conversation?.messages.at(-1)?.content.length ?? 0;

  // Auto-scroll vers le bas à chaque nouveau token / message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [count, lastLen]);

  if (!conversation || conversation.messages.length === 0) {
    return (
      <div className="empty">
        <div className="empty-logo">✶</div>
        <h2>Hermes Chat</h2>
        <p>Pose ta question pour démarrer la conversation.</p>
      </div>
    );
  }

  return (
    <div className="messages">
      {conversation.messages.map((m) => (
        <Message key={m.id} msg={m} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
