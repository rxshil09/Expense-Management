import { prisma } from '../db/prisma';

export interface ApprovalThreshold {
  amount: number;
  requiredApprovers: number;
  roles: string[];
}

export const DEFAULT_THRESHOLDS: ApprovalThreshold[] = [
  {
    amount: 100,
    requiredApprovers: 1,
    roles: ['MANAGER', 'ADMIN'],
  },
  {
    amount: 1000,
    requiredApprovers: 2,
    roles: ['MANAGER', 'ADMIN'],
  },
  {
    amount: 5000,
    requiredApprovers: 1,
    roles: ['ADMIN'],
  },
];

export function getApprovalThreshold(amount: number): ApprovalThreshold {
  // Find the highest threshold that applies
  const applicableThresholds = DEFAULT_THRESHOLDS.filter(
    threshold => amount >= threshold.amount
  );
  
  if (applicableThresholds.length === 0) {
    return DEFAULT_THRESHOLDS[0]; // Default to lowest threshold
  }
  
  return applicableThresholds[applicableThresholds.length - 1];
}

export async function getApproversForExpense(
  companyId: string,
  amount: number,
  category?: string
) {
  const threshold = getApprovalThreshold(amount);
  
  const approvers = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: threshold.roles as any[] },
      isActive: true,
    },
    take: threshold.requiredApprovers,
    orderBy: {
      createdAt: 'asc', // Or any other criteria
    },
  });
  
  return approvers;
}