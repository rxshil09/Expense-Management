import { NextRequest } from 'next/server';
import { requireUser, requireRole, createApiError, createApiSuccess } from '../../../server/auth/guard';
import { prisma } from '../../../server/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    
    const rules = await prisma.rule.findMany({
      where: { 
        companyId: user.companyId,
        isActive: true,
      },
      orderBy: { sequence: 'asc' },
    });
    
    return createApiSuccess(rules);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN');
    const user = await requireUser();
    const body = await request.json();
    
    const rule = await prisma.rule.create({
      data: {
        ...body,
        companyId: user.companyId,
      },
    });
    
    return createApiSuccess(rule, 201);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}