import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { login } from "@/lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(password);
      await navigate({ to: "/" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-logo">✶</div>
        <h1>Hermes Chat</h1>
        <p className="login-sub">Accès protégé</p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <div className="login-error">{error}</div> : null}
        <button type="submit" disabled={loading || !password}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
