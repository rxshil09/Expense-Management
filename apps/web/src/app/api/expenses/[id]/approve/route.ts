import { NextRequest } from 'next/server';
import { requireUser, createApiError, createApiSuccess } from '../../../../../server/auth/guard';
import { processApproval } from '../../../../../server/approvals/engine';
import { ApprovalActionSchema } from '@expense-mgmt/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const { id: expenseId } = params;
    const body = await request.json();
    const { status, comments } = ApprovalActionSchema.parse(body);
    
    const approval = await processApproval(
      expenseId,
      user.id,
      status,
      comments
    );
    
    return createApiSuccess(approval);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}