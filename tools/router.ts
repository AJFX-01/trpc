import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const myRouter = t.router({
  getUser: t.procedure
    .input(z.object({
      id: z.string(),
    }))
    .output(z.object({
      name: z.string(),
      email: z.string(),
    }))
    .query(({ input }) => {
      return {
        name: 'John Doe',
        email: 'john@example.com',
      };
    }),
    
  createUser: t.procedure
    .input(z.object({
      name: z.string(),
      email: z.string(),
    }))
    .output(z.object({
      success: z.boolean(),
    }))
    .mutation(({ input }) => {
      // Simulate user creation
      return { success: true };
    }),
});