import { useRef, useState } from "react";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function Composer({ onSend, onStop, isStreaming }: Props) {
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }

  function submit() {
    if (isStreaming) return;
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = "auto";
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer">
      <textarea
        ref={taRef}
        value={text}
        rows={1}
        placeholder="Écris à Hermes…   (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
        onChange={(e) => {
          setText(e.target.value);
          autoGrow();
        }}
        onKeyDown={onKeyDown}
      />
      {isStreaming ? (
        <button className="btn-stop" onClick={onStop} title="Arrêter">
          ■ Stop
        </button>
      ) : (
        <button className="btn-send" onClick={submit} disabled={!text.trim()} title="Envoyer">
          ➤
        </button>
      )}
    </div>
  );
}
