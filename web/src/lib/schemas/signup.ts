import { z } from "zod";

export const SignupBodySchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
  displayName: z.string().max(120).nullable().optional(),
});

export type SignupBody = z.infer<typeof SignupBodySchema>;
