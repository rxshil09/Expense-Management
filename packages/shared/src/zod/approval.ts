import { z } from 'zod';

export const ApprovalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const ApprovalActionSchema = z.object({
  status: ApprovalStatusSchema,
  comments: z.string().optional(),
});

export const BulkApprovalSchema = z.object({
  expenseIds: z.array(z.string()),
  status: ApprovalStatusSchema,
  comments: z.string().optional(),
});

export const ApprovalQuerySchema = z.object({
  status: ApprovalStatusSchema.optional(),
  expenseId: z.string().optional(),
  approverId: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type ApprovalAction = z.infer<typeof ApprovalActionSchema>;
export type BulkApproval = z.infer<typeof BulkApprovalSchema>;
export type ApprovalQuery = z.infer<typeof ApprovalQuerySchema>;