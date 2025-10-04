import { NextRequest } from 'next/server';
import { requireUser, createApiError, createApiSuccess } from '../../../../server/auth/guard';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    
    return createApiSuccess({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      company: user.company,
    });
  } catch (error: any) {
    return createApiError(error.message, 401);
  }
}