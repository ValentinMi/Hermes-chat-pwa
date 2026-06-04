import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono, type Context } from "hono";
import { logger } from "hono/logger";
import { getSignedCookie, setSignedCookie, deleteCookie } from "hono/cookie";
import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { config, SESSION_COOKIE } from "./config.ts";
import type { ChatRequest } from "../shared/types.ts";

const app = new Hono();
app.use("*", logger());

/* ------------------------------------------------------------------ *
 * Authentification — login simple par mot de passe + cookie signé.   *
 * ------------------------------------------------------------------ */

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

async function isAuthenticated(c: Context): Promise<boolean> {
  const token = await getSignedCookie(c, config.sessionSecret, SESSION_COOKIE);
  return token === "ok";
}

app.get("/api/session", async (c) => {
  return c.json({ authenticated: await isAuthenticated(c) });
});

app.post("/api/login", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { password?: string };
  if (!body.password || !safeEqual(body.password, config.appPassword)) {
    return c.json({ error: "Mot de passe incorrect." }, 401);
  }
  await setSignedCookie(c, SESSION_COOKIE, "ok", config.sessionSecret, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "Lax",
    path: "/",
    maxAge: config.sessionMaxAge,
  });
  return c.json({ authenticated: true });
});

app.post("/api/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ authenticated: false });
});

/* ------------------------------------------------------------------ *
 * Garde d'authentification sur les routes Hermes.                    *
 * ------------------------------------------------------------------ */

app.use("/api/models", async (c, next) => {
  if (!(await isAuthenticated(c))) return c.json({ error: "Non authentifié." }, 401);
  await next();
});
app.use("/api/chat", async (c, next) => {
  if (!(await isAuthenticated(c))) return c.json({ error: "Non authentifié." }, 401);
  await next();
});

function hermesHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.hermesApiKey) headers.Authorization = `Bearer ${config.hermesApiKey}`;
  return headers;
}

/* Liste des modèles disponibles (proxy /v1/models). */
app.get("/api/models", async (c) => {
  try {
    const res = await fetch(`${config.hermesBaseUrl}/models`, {
      headers: hermesHeaders(),
    });
    if (!res.ok) {
      return c.json({ data: [{ id: config.defaultModel }], default: config.defaultModel });
    }
    const json = (await res.json()) as { data?: Array<{ id: string }> };
    return c.json({ data: json.data ?? [{ id: config.defaultModel }], default: config.defaultModel });
  } catch {
    // Endpoint injoignable : on renvoie au moins le modèle par défaut.
    return c.json({ data: [{ id: config.defaultModel }], default: config.defaultModel });
  }
});

/* Chat en streaming (proxy SSE vers /v1/chat/completions). */
app.post("/api/chat", async (c) => {
  const body = (await c.req.json()) as ChatRequest;

  const upstreamBody: Record<string, unknown> = {
    model: body.model || config.defaultModel,
    messages: body.messages,
    stream: true,
  };
  if (typeof body.temperature === "number") upstreamBody.temperature = body.temperature;
  // Mode raisonnement Hermes 4 : on ne l'ajoute que s'il est explicitement activé,
  // pour garder une charge utile standard par défaut (compat maximale).
  if (body.reasoning) upstreamBody.chat_template_kwargs = { thinking: true };

  let upstream: Response;
  try {
    upstream = await fetch(`${config.hermesBaseUrl}/chat/completions`, {
      method: "POST",
      headers: hermesHeaders(),
      body: JSON.stringify(upstreamBody),
    });
  } catch (err) {
    const msg = `Impossible de joindre Hermes à ${config.hermesBaseUrl} : ${(err as Error).message}`;
    console.error("[chat]", msg);
    return c.json({ error: msg }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error(`[chat] Hermes a répondu ${upstream.status}: ${detail.slice(0, 500)}`);
    return c.json({ error: `Erreur Hermes (${upstream.status}): ${detail}` }, 502);
  }

  // On relaie le flux SSE tel quel au navigateur.
  // NB : pas d'en-têtes hop-by-hop (Connection/Transfer-Encoding) qui perturbent
  // les reverse-proxies ; X-Accel-Buffering désactive la mise en tampon (nginx).
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
});

/* Diagnostic de connectivité vers Hermes (auth requise). */
app.get("/api/diag", async (c) => {
  if (!(await isAuthenticated(c))) return c.json({ error: "Non authentifié." }, 401);
  const url = `${config.hermesBaseUrl}/models`;
  try {
    const res = await fetch(url, {
      headers: hermesHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text().catch(() => "");
    return c.json({
      ok: res.ok,
      target: url,
      status: res.status,
      hasApiKey: Boolean(config.hermesApiKey),
      body: text.slice(0, 800),
    });
  } catch (err) {
    return c.json({
      ok: false,
      target: url,
      hasApiKey: Boolean(config.hermesApiKey),
      error: (err as Error).message,
    });
  }
});

/* ------------------------------------------------------------------ *
 * Fichiers statiques de la PWA (production uniquement).              *
 * ------------------------------------------------------------------ */

if (config.isProd) {
  const clientDir = "./dist/client";
  const indexPath = `${clientDir}/index.html`;
  app.use("/*", serveStatic({ root: clientDir }));
  // Fallback SPA : toute route inconnue renvoie index.html.
  if (existsSync(indexPath)) {
    app.get("*", async (c) => c.html(await readFile(indexPath, "utf-8")));
  }
}

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Hermes Chat proxy à l'écoute sur http://localhost:${info.port}`);
  console.log(`→ Hermes endpoint: ${config.hermesBaseUrl}`);
});
