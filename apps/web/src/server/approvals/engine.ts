import { prisma } from '../db/prisma';
import { RuleType, ApprovalStatus } from '@expense-mgmt/shared';

interface ApprovalRule {
  id: string;
  name: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  approvers: string[];
  sequence: number;
  percentage?: number;
  ruleType: RuleType;
}

export async function createApprovalWorkflow(expenseId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { company: true },
  });

  if (!expense) {
    throw new Error('Expense not found');
  }

  // Find applicable rules
  const rules = await prisma.rule.findMany({
    where: {
      companyId: expense.companyId,
      isActive: true,
      ...(expense.category && { 
        OR: [
          { category: expense.category },
          { category: null },
        ]
      }),
      ...(expense.amount && {
        OR: [
          {
            AND: [
              { minAmount: { lte: expense.amount } },
              { maxAmount: { gte: expense.amount } },
            ],
          },
          {
            AND: [
              { minAmount: { lte: expense.amount } },
              { maxAmount: null },
            ],
          },
          {
            AND: [
              { minAmount: null },
              { maxAmount: { gte: expense.amount } },
            ],
          },
          {
            AND: [
              { minAmount: null },
              { maxAmount: null },
            ],
          },
        ],
      }),
    },
    orderBy: {
      sequence: 'asc',
    },
  });

  if (rules.length === 0) {
    // No rules found, auto-approve or require manual approval
    return;
  }

  // Create approval records based on rules
  for (const rule of rules) {
    // Convert Decimal to number for the approval rule
    const approvalRule = {
      ...rule,
      minAmount: rule.minAmount ? Number(rule.minAmount) : undefined,
      maxAmount: rule.maxAmount ? Number(rule.maxAmount) : undefined,
    };
    await createApprovalsForRule(expenseId, approvalRule as ApprovalRule);
  }
}

async function createApprovalsForRule(
  expenseId: string,
  rule: ApprovalRule
) {
  switch (rule.ruleType) {
    case 'SEQUENTIAL':
      await createSequentialApprovals(expenseId, rule);
      break;
    case 'PERCENTAGE':
      await createPercentageApprovals(expenseId, rule);
      break;
    case 'HYBRID':
      await createHybridApprovals(expenseId, rule);
      break;
  }
}

async function createSequentialApprovals(
  expenseId: string,
  rule: ApprovalRule
) {
  for (let i = 0; i < rule.approvers.length; i++) {
    await prisma.approval.create({
      data: {
        expenseId,
        approverId: rule.approvers[i],
        sequence: rule.sequence + i,
        status: 'PENDING',
      },
    });
  }
}

async function createPercentageApprovals(
  expenseId: string,
  rule: ApprovalRule
) {
  // For percentage-based approvals, all approvers can approve simultaneously
  // and approval happens when the percentage threshold is met
  for (const approverId of rule.approvers) {
    await prisma.approval.create({
      data: {
        expenseId,
        approverId,
        sequence: rule.sequence,
        status: 'PENDING',
      },
    });
  }
}

async function createHybridApprovals(
  expenseId: string,
  rule: ApprovalRule
) {
  // Hybrid: combination of sequential and percentage
  // Implementation depends on specific business logic
  await createSequentialApprovals(expenseId, rule);
}

export async function processApproval(
  expenseId: string,
  approverId: string,
  status: ApprovalStatus,
  comments?: string
) {
  // Update the approval
  const approval = await prisma.approval.update({
    where: {
      expenseId_sequence: {
        expenseId,
        sequence: 1, // This should be dynamic based on the approval sequence
      },
    },
    data: {
      status,
      comments,
    },
  });

  // Check if expense should be approved/rejected
  await checkExpenseStatus(expenseId);

  return approval;
}

async function checkExpenseStatus(expenseId: string) {
  const approvals = await prisma.approval.findMany({
    where: { expenseId },
    orderBy: { sequence: 'asc' },
  });

  const hasRejection = approvals.some(a => a.status === 'REJECTED');
  if (hasRejection) {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'REJECTED' },
    });
    return;
  }

  const allApproved = approvals.every(a => a.status === 'APPROVED');
  if (allApproved && approvals.length > 0) {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'APPROVED' },
    });
  }
}