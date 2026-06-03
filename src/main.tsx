import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { registerSW } from "virtual:pwa-register";
import { router } from "./router";
import { hydrateStores } from "./store";
import "highlight.js/styles/github-dark.css";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 } },
});

// Mise à jour automatique du service worker.
registerSW({ immediate: true });

// On hydrate les conversations/réglages depuis IndexedDB avant de monter l'app.
hydrateStores().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
});
