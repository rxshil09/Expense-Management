import { NextRequest } from 'next/server';
import { requireUser, requireRole, createApiError, createApiSuccess } from '../../../../server/auth/guard';
import { prisma } from '../../../../server/db/prisma';
import { UpdateUserSchema } from '@expense-mgmt/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireUser();
    const { id } = params;
    
    const user = await prisma.user.findFirst({
      where: {
        id,
        companyId: currentUser.companyId,
      },
      include: { company: true },
    });
    
    if (!user) {
      return createApiError('User not found', 404);
    }
    
    return createApiSuccess(user);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireUser();
    const { id } = params;
    
    // Users can only update themselves, or admins can update anyone
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      return createApiError('Insufficient permissions', 403);
    }
    
    const body = await request.json();
    const updateData = UpdateUserSchema.parse(body);
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { company: true },
    });
    
    return createApiSuccess(user);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('ADMIN');
    const { id } = params;
    
    // Soft delete by setting isActive to false
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    
    return createApiSuccess({ message: 'User deleted successfully' });
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}