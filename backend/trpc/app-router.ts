import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { usersRouter } from "./routes/users";
import { bookingsRouter } from "./routes/bookings";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  users: usersRouter,
  bookings: bookingsRouter,
});

export type AppRouter = typeof appRouter;
