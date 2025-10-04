export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type RuleType = 'SEQUENTIAL' | 'PERCENTAGE' | 'HYBRID';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rule {
  id: string;
  name: string;
  companyId: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  approvers: string[];
  sequence: number;
  percentage?: number;
  ruleType: RuleType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  companyId: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: Date;
  receiptUrl?: string;
  status: ExpenseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Approval {
  id: string;
  expenseId: string;
  approverId: string;
  sequence: number;
  status: ApprovalStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}