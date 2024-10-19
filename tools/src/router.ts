import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();


export const appRouter = t.router({
  getUser: t.procedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return { id: input.id, name: 'John Doe' };
    }),
  
  createUser: t.procedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input }) => {
      return { id: '1', name: input.name };
    }),
});


export type AppRouter = typeof appRouter;
