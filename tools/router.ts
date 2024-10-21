
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

// Initialize tRPC
const t = initTRPC.create();

// Define the Zod schemas for input and output.
const GetUserInputSchema = z.object({
  id: z.string().describe('The ID of the user to retrieve.'),
});

const GetUserOutputSchema = z.object({
  name: z.string().describe('The name of the user.'),
  email: z.string().describe('The email of the user.'),
});

const CreateUserInputSchema = z.object({
  name: z.string().describe('The name of the user to create.'),
  email: z.string().describe('The email of the user to create.'),
});

const CreateUserOutputSchema = z.object({
  success: z.boolean().describe('Indicates if the user was created successfully.'),
});

// Create the router and define the procedures using `initTRPC`
export const myRouter = t.router({
  getUser: t.procedure
    .input(GetUserInputSchema)
    .output(GetUserOutputSchema)
    .query(({ input }) => {
      // Simulate fetching user from a database
      return {
        name: 'John Doe',
        email: 'john@example.com',
      };
    }),
  
  createUser: t.procedure
    .input(CreateUserInputSchema)
    .output(CreateUserOutputSchema)
    .mutation(({ input }) => {
      // Simulate user creation
      return { success: true };
    }),
});
