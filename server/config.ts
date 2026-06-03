// Configuration du serveur proxy, lue depuis l'environnement.
// En production (Coolify), renseigner ces variables dans l'UI du service.

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(
      `Variable d'environnement manquante: ${name}. ` +
        `Voir .env.example pour la liste complète.`,
    );
  }
  return value;
}

const isProd = process.env.NODE_ENV === "production";

export const config = {
  isProd,
  // Port du serveur. En dev, Vite proxifie /api vers ce port.
  port: Number(process.env.PORT ?? process.env.API_PORT ?? (isProd ? 3001 : 8787)),

  // Endpoint Hermes compatible OpenAI, ex: http://hermes:8642/v1
  hermesBaseUrl: required("HERMES_BASE_URL", isProd ? undefined : "http://localhost:8642/v1").replace(/\/$/, ""),
  // Clé API Hermes — JAMAIS exposée au navigateur, utilisée seulement ici.
  hermesApiKey: process.env.HERMES_API_KEY ?? "",

  // Modèle proposé par défaut dans l'UI.
  defaultModel: process.env.HERMES_DEFAULT_MODEL ?? "hermes-4",

  // Mot de passe d'accès à l'app (login simple mono-utilisateur).
  appPassword: required("APP_PASSWORD", isProd ? undefined : "hermes"),
  // Secret de signature des cookies de session.
  sessionSecret: required(
    "SESSION_SECRET",
    isProd ? undefined : "dev-secret-change-me-please-0123456789",
  ),

  // Durée de validité de la session (secondes).
  sessionMaxAge: Number(process.env.SESSION_MAX_AGE ?? 60 * 60 * 24 * 30),
};

export const SESSION_COOKIE = "hermes_session";
