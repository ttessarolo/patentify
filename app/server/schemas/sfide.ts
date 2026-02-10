/**
 * Zod schemas per il dominio "sfide" (multiplayer challenges).
 * Definiscono il contratto API per creazione, completamento,
 * abort, storico sfide e token Ably.
 */

import * as z from 'zod';

// ============================================================
// Enums
// ============================================================

export const sfidaStatusSchema = z.enum(['in_progress', 'completed', 'aborted']);

// ============================================================
// getAblyToken
// ============================================================

export const getAblyTokenOutputSchema = z.object({
  keyName: z.string(),
  clientId: z.string().optional(),
  timestamp: z.number(),
  nonce: z.string(),
  mac: z.string(),
  capability: z.string().optional(),
  ttl: z.number().optional(),
});

// ============================================================
// createSfida
// ============================================================

export const createSfidaInputSchema = z.object({
  opponentId: z.string().min(1),
});

export const createSfidaOutputSchema = z.object({
  sfida_id: z.number().int(),
  quiz_id_a: z.number().int(),
  quiz_id_b: z.number().int(),
  game_started_at: z.string(),
});

// ============================================================
// completeSfida
// ============================================================

export const completeSfidaInputSchema = z.object({
  sfida_id: z.number().int().positive(),
  correct_count: z.number().int().min(0),
});

export const completeSfidaOutputSchema = z.object({
  success: z.boolean(),
  both_finished: z.boolean(),
  winner_id: z.string().nullable(),
  player_a_correct: z.number().int(),
  player_b_correct: z.number().int(),
  promosso: z.boolean(),
});

// ============================================================
// getSfidaResult
// ============================================================

export const getSfidaResultInputSchema = z.object({
  sfida_id: z.number().int().positive(),
});

export const getSfidaResultOutputSchema = z.object({
  winner_id: z.string().nullable(),
  my_correct: z.number().int(),
  opponent_correct: z.number().int(),
  both_finished: z.boolean(),
  status: z.string(),
});

// ============================================================
// abortSfida
// ============================================================

export const abortSfidaInputSchema = z.object({
  sfida_id: z.number().int().positive(),
});

export const abortSfidaOutputSchema = z.object({
  success: z.boolean(),
});

// ============================================================
// getSfideHistory
// ============================================================

export const sfidaHistoryRowSchema = z.object({
  sfida_id: z.number().int(),
  created_at: z.string(),
  opponent_id: z.string(),
  opponent_name: z.string(),
  opponent_username: z.string().nullable(),
  opponent_image_url: z.string().nullable(),
  winner_id: z.string().nullable(),
  status: sfidaStatusSchema,
  my_correct: z.number().int(),
  opponent_correct: z.number().int(),
  my_quiz_id: z.number().int().nullable(),
});

export const sfidaHistoryOutputSchema = z.object({
  sfide: z.array(sfidaHistoryRowSchema),
});

// ============================================================
// getSfideHistoryAll
// ============================================================

export const sfideHistoryFilterSchema = z.enum(['all', 'won', 'lost']);

export const getSfideHistoryAllInputSchema = z.object({
  filter: sfideHistoryFilterSchema.default('all'),
});

export const getSfideHistoryAllOutputSchema = sfidaHistoryOutputSchema;

// ============================================================
// getOnlineUsersDetails
// ============================================================

export const getOnlineUsersDetailsInputSchema = z.object({
  userIds: z.array(z.string()).min(1).max(200),
});

export const onlineUserDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  image_url: z.string().nullable(),
  is_following: z.boolean(),
});

export const getOnlineUsersDetailsOutputSchema = z.object({
  users: z.array(onlineUserDetailSchema),
});
