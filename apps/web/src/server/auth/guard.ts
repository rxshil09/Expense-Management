import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './jwt';
import { Role } from '@expense-mgmt/shared';
import { prisma } from '../db/prisma';

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  
  // Fetch full user data from database
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { company: true },
  });
  
  if (!fullUser || !fullUser.isActive) {
    throw new Error('User not found or inactive');
  }
  
  return fullUser;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  
  if (!roles.includes(user.role as Role)) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}

export function createApiError(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

export function createApiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}