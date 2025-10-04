import { prisma } from '../db/prisma';
import { Prisma } from '@prisma/client';
import { CreateExpenseInput, UpdateExpenseInput, ExpenseQuery } from '@expense-mgmt/shared';

export async function createExpense(
  userId: string,
  companyId: string,
  data: CreateExpenseInput
) {
  return await prisma.expense.create({
    data: {
      ...data,
      userId,
      companyId,
      date: new Date(data.date),
    },
    include: {
      user: true,
      approvals: {
        include: {
          approver: true,
        },
        orderBy: {
          sequence: 'asc',
        },
      },
    },
  });
}

export async function getExpenses(
  userId: string,
  companyId: string,
  query: ExpenseQuery
) {
  const {
    status,
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1,
    limit = 10,
  } = query;

  const where: Prisma.ExpenseWhereInput = {
    companyId,
    ...(status && { status }),
    ...(category && { category }),
    ...(startDate && { date: { gte: new Date(startDate) } }),
    ...(endDate && { date: { lte: new Date(endDate) } }),
    ...(minAmount && { amount: { gte: minAmount } }),
    ...(maxAmount && { amount: { lte: maxAmount } }),
  };

  const skip = (page - 1) * limit;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: true,
        approvals: {
          include: {
            approver: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    data: expenses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getExpenseById(id: string, companyId: string) {
  return await prisma.expense.findFirst({
    where: { id, companyId },
    include: {
      user: true,
      approvals: {
        include: {
          approver: true,
        },
        orderBy: {
          sequence: 'asc',
        },
      },
    },
  });
}

export async function updateExpense(
  id: string,
  companyId: string,
  data: UpdateExpenseInput
) {
  return await prisma.expense.update({
    where: { id, companyId },
    data: {
      ...data,
      ...(data.date && { date: new Date(data.date) }),
    },
    include: {
      user: true,
      approvals: {
        include: {
          approver: true,
        },
        orderBy: {
          sequence: 'asc',
        },
      },
    },
  });
}

export async function deleteExpense(id: string, companyId: string) {
  return await prisma.expense.delete({
    where: { id, companyId },
  });
}