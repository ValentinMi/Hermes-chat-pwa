import { memo } from "react";
import { Markdown } from "./Markdown";
import { ThinkBlock } from "./ThinkBlock";
import { ToolCallBlock } from "./ToolCallBlock";
import type { UIMessage } from "@/store/types";

export const Message = memo(function Message({ msg }: { msg: UIMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`msg ${isUser ? "msg-user" : "msg-assistant"}`}>
      <div className="msg-avatar" aria-hidden>
        {isUser ? "🧑" : "✶"}
      </div>
      <div className="msg-body">
        <div className="msg-role">{isUser ? "Vous" : "Hermes"}</div>

        {msg.think ? <ThinkBlock think={msg.think} streaming={msg.streaming} /> : null}
        {msg.toolCalls?.length ? <ToolCallBlock toolCalls={msg.toolCalls} /> : null}

        {msg.content ? (
          <Markdown>{msg.content}</Markdown>
        ) : msg.streaming && !msg.think && !msg.toolCalls?.length ? (
          <span className="typing">
            <span></span>
            <span></span>
            <span></span>
          </span>
        ) : null}

        {msg.streaming && msg.content ? <span className="cursor">▋</span> : null}
        {msg.error ? <div className="msg-error">⚠ {msg.error}</div> : null}
      </div>
    </div>
  );
});
