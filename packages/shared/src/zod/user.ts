import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']);

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: RoleSchema.default('EMPLOYEE'),
  companyId: z.string(),
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = LoginSchema.extend({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyDomain: z.string().min(1, 'Company domain is required'),
});

export const UserQuerySchema = z.object({
  role: RoleSchema.optional(),
  isActive: z.boolean().optional(),
  companyId: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;