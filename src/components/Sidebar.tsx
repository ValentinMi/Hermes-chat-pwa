import { useStore } from "@tanstack/react-store";
import {
  conversationsStore,
  deleteConversation,
  newConversation,
  renameConversation,
  setActive,
} from "@/store";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function Sidebar({ open, onClose, onOpenSettings, onLogout }: Props) {
  const conversations = useStore(conversationsStore, (s) => s.conversations);
  const activeId = useStore(conversationsStore, (s) => s.activeId);

  return (
    <>
      <div className={`sidebar-scrim ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-head">
          <span className="brand">✶ Hermes</span>
          <button
            className="btn-new"
            onClick={() => {
              newConversation();
              onClose();
            }}
          >
            + Nouveau
          </button>
        </div>

        <nav className="conv-list">
          {conversations.length === 0 ? (
            <p className="conv-empty">Aucune conversation.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`conv-item ${c.id === activeId ? "active" : ""}`}
                onClick={() => {
                  setActive(c.id);
                  onClose();
                }}
              >
                <span className="conv-title">{c.title}</span>
                <span className="conv-actions">
                  <button
                    title="Renommer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = window.prompt("Nouveau titre :", c.title);
                      if (next != null) renameConversation(c.id, next);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    title="Supprimer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Supprimer cette conversation ?")) {
                        deleteConversation(c.id);
                      }
                    }}
                  >
                    🗑
                  </button>
                </span>
              </div>
            ))
          )}
        </nav>

        <div className="sidebar-foot">
          <button onClick={onOpenSettings}>⚙ Réglages</button>
          <button onClick={onLogout}>⎋ Déconnexion</button>
        </div>
      </aside>
    </>
  );
}
