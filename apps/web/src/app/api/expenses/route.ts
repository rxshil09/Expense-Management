import { NextRequest } from 'next/server';
import { requireUser, createApiError, createApiSuccess } from '../../../server/auth/guard';
import { createExpense, getExpenses } from '../../../server/expenses/service';
import { CreateExpenseSchema, ExpenseQuerySchema } from '@expense-mgmt/shared';
import { createApprovalWorkflow } from '../../../server/approvals/engine';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    
    const query = ExpenseQuerySchema.parse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
    });

    const result = await getExpenses(user.id, user.companyId, query);
    return createApiSuccess(result);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const expenseData = CreateExpenseSchema.parse(body);
    
    const expense = await createExpense(user.id, user.companyId, expenseData);
    
    // Create approval workflow
    await createApprovalWorkflow(expense.id);
    
    return createApiSuccess(expense, 201);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}