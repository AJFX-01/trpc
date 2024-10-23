
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

// import { initTRPC } from '@trpc/server';
// import { z } from 'zod';  // Zod for input validation

// // Initialize the TRPC instance
// const t = initTRPC.create();

// // Create the procedure types
// const publicProcedure = t.procedure;

// // Define the userRouter with query and mutation
// const userRouter = t.router({
//   getUser: publicProcedure.input(z.string()).query(({ input }) => {
//     // Simulate fetching user data based on the input (user ID)
//     return { id: input, name: 'John Doe' };
//   }),
//   updateUser: publicProcedure
//     .input(z.object({ id: z.string(), name: z.string() }))  // Expecting an object with id and name
//     .mutation(({ input }) => {
//       // Simulate updating user data
//       return { success: true };
//     }),
// });

// // Define the appRouter with a nested userRouter and a simple status query
// export const myRouter = t.router({
//   user: userRouter,  // Nest the userRouter
//   getStatus: publicProcedure.query(() => 'OK'),  // Simple status check
// });

// Export the type of the appRouter for use in your TRPC client
// export type AppRouter = typeof myRouter;


// export const myRouter = t.router({
//   // Greeting procedure
//   greeting: t.procedure
//   .input (
//   z.object ({
//   name: z.string(),
//   })
//   )
//   .output (z.string ())
//   .query (({ input }) => 'Hello, ${input .name)!'),
//   deep: t.router ({
//   test: t.procedure.query (() => "Hello, nested!"),
//     }),
//   });