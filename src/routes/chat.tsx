import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { Sidebar } from "@/components/Sidebar";
import { SettingsDialog } from "@/components/SettingsDialog";
import { MessageList } from "@/components/MessageList";
import { Composer } from "@/components/Composer";
import { useChat } from "@/hooks/useChat";
import { logout as apiLogout } from "@/lib/api";
import { conversationsStore, settingsStore } from "@/store";

export function ChatPage() {
  const navigate = useNavigate();
  const { send, stop, isStreaming } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const conversations = useStore(conversationsStore, (s) => s.conversations);
  const activeId = useStore(conversationsStore, (s) => s.activeId);
  const model = useStore(settingsStore, (s) => s.model);
  const active = conversations.find((c) => c.id === activeId);

  async function handleLogout() {
    await apiLogout();
    await navigate({ to: "/login" });
  }

  return (
    <div className="app">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => {
          setSettingsOpen(true);
          setSidebarOpen(false);
        }}
        onLogout={handleLogout}
      />

      <main className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Menu">
            ☰
          </button>
          <div className="topbar-title">{active?.title ?? "Hermes Chat"}</div>
          <button className="model-chip" onClick={() => setSettingsOpen(true)} title="Réglages">
            {model}
          </button>
        </header>

        <MessageList conversation={active} />
        <Composer onSend={send} onStop={stop} isStreaming={isStreaming} />
      </main>

      {settingsOpen ? <SettingsDialog onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  );
}
