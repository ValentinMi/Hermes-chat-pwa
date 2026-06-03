import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { getSession } from "@/lib/api";
import { ChatPage } from "@/routes/chat";
import { LoginPage } from "@/routes/login";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    const { authenticated } = await getSession();
    if (!authenticated) throw redirect({ to: "/login" });
  },
  component: ChatPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: async () => {
    const { authenticated } = await getSession();
    if (authenticated) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
