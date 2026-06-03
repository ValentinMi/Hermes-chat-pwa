# Hermes Chat PWA

Une **PWA installable** pour discuter avec un **agent Hermes** (Nous Research),
avec une interface de chat moderne type Discord/Telegram. Pensée pour être
hébergée sur un **VPS sous Coolify**.

> La PWA est un **client** : le moteur Hermes (le gateway
> [Hermes Agent](https://hermes-agent.nousresearch.com/) de Nous Research, ou
> tout autre endpoint compatible OpenAI) tourne **séparément**. La PWA s'y
> connecte via un petit proxy qui garde la clé API côté serveur.

## Fonctionnalités

- 💬 Chat en **streaming** (SSE), multi-conversations
- 🗂️ Historique **stocké localement** (IndexedDB) — rien sur le serveur
- 🧠 Affichage repliable du **raisonnement** Hermes 4 (`<think>…</think>`)
- 🛠️ Rendu des **tool calls** (fonctions appelées + arguments)
- 🎛️ Sélecteur de **modèle**, température, system prompt (persistés localement)
- 📝 Markdown + **coloration syntaxique**
- 🔐 **Login** par mot de passe ; la clé API Hermes n'atteint jamais le navigateur
- 📱 **PWA installable** (manifest + service worker, shell hors-ligne)

## Architecture

```
[Navigateur / PWA]  --fetch + SSE (cookie de session)-->  [Proxy Hono]  --/v1/chat/completions-->  [Hermes]
   React + TanStack                                    sert le statique + cache la clé        gateway / endpoint OpenAI-compatible
```

- **Frontend** : React + Vite, TanStack Router/Query/Store, `vite-plugin-pwa`.
- **Backend** : un serveur **Hono** unique qui sert les fichiers statiques **et**
  proxifie `/api/*` vers Hermes. Il détient `HERMES_API_KEY` et la session.

## Développement

```bash
cp .env.example .env        # renseigner HERMES_BASE_URL, APP_PASSWORD, SESSION_SECRET…
npm install
npm run dev                 # Vite (5173) + proxy Hono (8787), /api proxifié
```

Ouvrir http://localhost:5173. Autres commandes :

```bash
npm run build       # typecheck + build de production (dist/client)
npm start           # lance le serveur de prod (sert dist + /api) sur PORT
npm run typecheck   # vérification de types seule
```

## Variables d'environnement

| Variable               | Requis | Description                                                        |
| ---------------------- | :----: | ------------------------------------------------------------------ |
| `HERMES_BASE_URL`      |   ✅   | Endpoint compatible OpenAI, ex. `http://hermes:8642/v1`            |
| `HERMES_API_KEY`       |   —    | Clé du fournisseur (vide si l'endpoint n'en demande pas)          |
| `HERMES_DEFAULT_MODEL` |   —    | Modèle par défaut (défaut `hermes-4`)                             |
| `APP_PASSWORD`         |   ✅   | Mot de passe d'accès à l'app                                      |
| `SESSION_SECRET`       |   ✅   | Secret de signature des cookies (`openssl rand -hex 32`)          |
| `PORT`                 |   —    | Port d'écoute (défaut `3001`)                                     |
| `SESSION_MAX_AGE`      |   —    | Durée de session en secondes (défaut 30 j)                        |

Voir [`.env.example`](./.env.example).

## Déploiement sur Coolify

1. **New Resource → Application** depuis ce dépôt Git (branche de ton choix).
2. **Build Pack : Dockerfile** (présent à la racine). Coolify détecte le port `3001`.
3. Renseigner les variables d'environnement ci-dessus dans l'onglet *Environment*.
4. (Optionnel) Brancher un domaine + HTTPS via le proxy intégré de Coolify.
5. Déployer. Le healthcheck `/api/session` indique l'état du service.

### Joindre le gateway Hermes Agent

- **Hermes Agent dans un autre service Coolify** : place les deux sur le même
  réseau Docker et pointe `HERMES_BASE_URL` sur `http://<nom-du-service>:8642/v1`.
- **Hermes Agent sur l'hôte** : `HERMES_BASE_URL=http://host.docker.internal:8642/v1`
  (sous Linux, ajouter `host.docker.internal:host-gateway` dans `extra_hosts`).
- **Tout dans un compose** : voir [`docker-compose.yaml`](./docker-compose.yaml),
  qui contient un exemple de service `nousresearch/hermes-agent` commenté.

Démarrer le gateway Hermes Agent (référence) :

```bash
docker run -d --name hermes --restart unless-stopped \
  -v ~/.hermes:/opt/data -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

## Notes

- Le **mode raisonnement** envoie `chat_template_kwargs: { thinking: true }` à
  l'endpoint (compatible vLLM/Hermes 4). S'il est ignoré, l'affichage `<think>`
  fonctionne quand même via le parsing des balises dans la réponse.
- Les conversations vivent dans IndexedDB du navigateur : multi-appareils =
  historiques distincts (cohérent avec un déploiement mono-utilisateur).
