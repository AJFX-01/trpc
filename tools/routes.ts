import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

// In-memory mock database (array of user objects)
const mockDatabase: { users: { id: string; name: string; email: string }[] } = {
  users: [], // Start with an empty array of users
};

// Base User Schema for input/output reuse
const BaseUserSchema = z.object({
  id: z.string().optional().describe('The ID of the user (optional for creation).'),
  name: z.string().describe('The name of the user.'),
  email: z.string().describe('The email of the user.'),
});

// Input schema for getting a user (only requires ID)
const GetUserInputSchema = BaseUserSchema.pick({
  id: true,
}).required({ id: true });

// Input schema for creating a user (excludes ID)
const CreateUserInputSchema = BaseUserSchema.omit({
  id: true,
});

// Output schema for createUser (success flag + user details)
const CreateUserOutputSchema = BaseUserSchema.extend({
  success: z.boolean().describe('Indicates if the user was created successfully.'),
});

// Output schema for getUser (reuses BaseUserSchema directly)
const GetUserOutputSchema = BaseUserSchema;

// Logic for getUser (using in-memory store)
const getUserLogic = ({ id }: z.infer<typeof GetUserInputSchema>) => {
  const user = mockDatabase.users.find((u) => u.id === id);
  if (!user) {
    throw new Error('User not found');
  }
  
  return user; // Return the full user details (name, email)
};

// Logic for createUser (chained output schema)
const createUserLogic = ({ name, email }: z.infer<typeof CreateUserInputSchema>) => {
  const id = String(mockDatabase.users.length + 1); // Simulate ID generation
  const newUser = { id, name, email };
  mockDatabase.users.push(newUser); // Add the user to the mock database
  
  return { success: true, ...newUser }; // Return success and user details
};

// Define router with procedures using chained schemas
export const myRouter = t.router({
  getUser: t.procedure
    .input(GetUserInputSchema)
    .output(GetUserOutputSchema)
    .query(({ input }) => getUserLogic(input)),
  
  createUser: t.procedure
    .input(CreateUserInputSchema)
    .output(CreateUserOutputSchema)
    .mutation(({ input }) => createUserLogic(input)),
});
