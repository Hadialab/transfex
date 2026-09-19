import { z } from 'zod';

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    // 2000 chars is the cost surface. Anything longer is almost certainly
    // either a paste mistake or an attempt to burn tokens. The frontend
    // never needs more than a couple hundred.
    .max(2000, 'Message is too long (2000 characters max)'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4000),
      })
    )
    // Matches the frontend's `messages.slice(-10)` - cap it server-side too,
    // so a modified client can't ship 500 turns and cost you a fortune.
    .max(20)
    .optional(),
});

export type ChatInput = z.infer<typeof chatSchema>;