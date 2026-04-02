import { z } from 'zod';

export const createConversationSchema = z.object({
  participant_id: z.string().uuid(),
  contract_id: z.string().uuid().optional(),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  media_url: z.string().url().optional(),
}).refine(data => data.text || data.media_url, {
  message: 'Either text or media_url is required',
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
