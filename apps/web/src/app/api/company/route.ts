import { NextRequest } from 'next/server';
import { requireUser, requireRole, createApiError, createApiSuccess } from '../../../server/auth/guard';
import { prisma } from '../../../server/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
    });
    
    if (!company) {
      return createApiError('Company not found', 404);
    }
    
    return createApiSuccess(company);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole('ADMIN');
    const user = await requireUser();
    const body = await request.json();
    
    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: body,
    });
    
    return createApiSuccess(company);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}