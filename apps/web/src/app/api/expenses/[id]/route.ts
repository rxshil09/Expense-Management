import { NextRequest } from 'next/server';
import { requireUser, createApiError, createApiSuccess } from '../../../../server/auth/guard';
import { getExpenseById, updateExpense, deleteExpense } from '../../../../server/expenses/service';
import { UpdateExpenseSchema } from '@expense-mgmt/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const { id } = params;
    
    const expense = await getExpenseById(id, user.companyId);
    
    if (!expense) {
      return createApiError('Expense not found', 404);
    }
    
    return createApiSuccess(expense);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const { id } = params;
    const body = await request.json();
    const updateData = UpdateExpenseSchema.parse(body);
    
    const expense = await updateExpense(id, user.companyId, updateData);
    
    return createApiSuccess(expense);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const { id } = params;
    
    await deleteExpense(id, user.companyId);
    
    return createApiSuccess({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}