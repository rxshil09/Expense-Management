import { z } from 'zod';

export const ExpenseStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING']);

export const CreateExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().or(z.date()),
  receiptUrl: z.string().url().optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

export const ExpenseQuerySchema = z.object({
  status: ExpenseStatusSchema.optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseQuery = z.infer<typeof ExpenseQuerySchema>;