import * as z from 'zod';

// ============================================================
// Input
// ============================================================

export const skullInputSchema = z.object({
  domanda_id: z.number().int().positive(),
});

// ============================================================
// Output
// ============================================================

export const skullOutputSchema = z.object({
  success: z.boolean(),
});
