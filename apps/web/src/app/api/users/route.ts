import { NextRequest } from 'next/server';
import { requireUser, requireRole, createApiError, createApiSuccess } from '../../../server/auth/guard';
import { prisma } from '../../../server/db/prisma';
import { CreateUserSchema, UserQuerySchema } from '@expense-mgmt/shared';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    
    const query = UserQuerySchema.parse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    });

    const { page = 1, limit = 10, role, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where = {
      companyId: user.companyId,
      ...(role && { role }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { company: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return createApiSuccess({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN');
    
    const body = await request.json();
    const userData = CreateUserSchema.parse(body);
    
    const user = await requireUser();
    
    const newUser = await prisma.user.create({
      data: {
        ...userData,
        companyId: user.companyId,
      },
      include: { company: true },
    });
    
    return createApiSuccess(newUser, 201);
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}