import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();
  const isServer = typeof document === "undefined";

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: !isServer,
    defaultPreloadStaleTime: 0,
    // Workers SSR bundles can drop router-core's isServer guards — set server state upfront.
    ...(isServer
      ? {
          isServer: true,
          origin: "http://localhost",
          history: createMemoryHistory({ initialEntries: ["/"] }),
        }
      : {}),
  });

  return router;
};
