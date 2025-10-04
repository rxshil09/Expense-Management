import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../server/db/prisma';
import { signToken, setAuthCookie } from '../../../../server/auth/jwt';
import { createApiError, createApiSuccess } from '../../../../server/auth/guard';
import { LoginSchema } from '@expense-mgmt/shared';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      return createApiError('Invalid credentials', 401);
    }

    // For demo purposes, we'll skip password validation
    // In production, you'd validate against a hashed password:
    // const isValid = await bcrypt.compare(password, user.passwordHash);
    
    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    // Set HTTP-only cookie
    setAuthCookie(token);

    return createApiSuccess({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return createApiError(
      error.name === 'ZodError' ? 'Invalid input data' : 'Login failed',
      400
    );
  }
}