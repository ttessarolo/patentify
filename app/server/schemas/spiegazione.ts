import * as z from 'zod';

// ============================================================
// Input
// ============================================================

export const getSpiegazioneInputSchema = z.object({
  domanda_id: z.number().int().positive(),
});

// ============================================================
// Output
// ============================================================

export const getSpiegazioneOutputSchema = z.object({
  spiegazione: z.string().nullable(),
});
