import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

// 🔥 Local backend URL
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Web
    return "http://localhost:8787";
  }

  // Mobile device (Expo Go)
  return "http://192.168.1.100:8787"; // ⚠️ replace with your local IP
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});