import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: z.enum(['patient', 'driver']),
  bloodGroup: z.string().optional(),
  emergencyContacts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string(),
    relation: z.string(),
  })),
  vehicleNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
});

const users: any[] = [];

export const usersRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string(),
      role: z.enum(['patient', 'driver']),
      vehicleNumber: z.string().optional(),
      licenseNumber: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const emailExists = users.some(u => u.email.toLowerCase() === input.email.toLowerCase());
      if (emailExists) {
        throw new Error('Email already registered');
      }
      
      const phoneExists = users.some(u => u.phone === input.phone);
      if (phoneExists) {
        throw new Error('Phone number already registered');
      }
      
      const newUser = {
        id: Date.now().toString(),
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        emergencyContacts: [],
        vehicleNumber: input.vehicleNumber,
        licenseNumber: input.licenseNumber,
      };
      
      users.push(newUser);
      return { success: true, user: newUser };
    }),
    
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
      role: z.enum(['patient', 'driver']),
    }))
    .mutation(({ input }) => {
      const user = users.find(u => 
        u.email.toLowerCase() === input.email.toLowerCase() && 
        u.role === input.role
      );
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      return { success: true, user };
    }),
    
  getAll: publicProcedure
    .query(() => {
      return users;
    }),
});
