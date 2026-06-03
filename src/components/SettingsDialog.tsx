import { useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { getModels } from "@/lib/api";
import { settingsStore } from "@/store";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const settings = useStore(settingsStore);
  const modelsQuery = useQuery({ queryKey: ["models"], queryFn: getModels });

  function set<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    settingsStore.setState((s) => ({ ...s, [key]: value }));
  }

  const models = modelsQuery.data?.data ?? [];

  return (
    <div className="dialog-scrim" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <header className="dialog-head">
          <h3>Réglages</h3>
          <button className="dialog-close" onClick={onClose}>
            ✕
          </button>
        </header>

        <label className="field">
          <span>Modèle</span>
          {modelsQuery.isError ? (
            <input
              value={settings.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="hermes-4"
            />
          ) : (
            <select value={settings.model} onChange={(e) => set("model", e.target.value)}>
              {models.length === 0 ? <option value={settings.model}>{settings.model}</option> : null}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="field">
          <span>
            Température <strong>{settings.temperature.toFixed(2)}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={settings.temperature}
            onChange={(e) => set("temperature", Number(e.target.value))}
          />
        </label>

        <label className="field field-row">
          <span>Mode raisonnement (Hermes 4 · &lt;think&gt;)</span>
          <input
            type="checkbox"
            checked={settings.reasoning}
            onChange={(e) => set("reasoning", e.target.checked)}
          />
        </label>

        <label className="field">
          <span>System prompt</span>
          <textarea
            rows={4}
            value={settings.systemPrompt}
            placeholder="Instructions système (optionnel)…"
            onChange={(e) => set("systemPrompt", e.target.value)}
          />
        </label>

        <p className="dialog-hint">Les réglages sont enregistrés localement sur cet appareil.</p>
      </div>
    </div>
  );
}
