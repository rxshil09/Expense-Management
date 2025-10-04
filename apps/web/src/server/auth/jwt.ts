import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@expense-mgmt/shared';

const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

export interface JwtPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}

export async function signToken(payload: Omit<JwtPayload, keyof JWTPayload>): Promise<string> {
  return await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, key, {
    algorithms: ['HS256'],
  });
  return payload as JwtPayload;
}

export function setAuthCookie(token: string) {
  cookies().set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function clearAuthCookie() {
  cookies().set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export function getAuthToken(): string | null {
  return cookies().get('auth-token')?.value || null;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getAuthToken();
    if (!token) return null;
    
    const payload = await verifyToken(token);
    
    // You would typically fetch the user from the database here
    // For now, return the payload as a basic user object
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role as any,
      companyId: payload.companyId,
    } as User;
  } catch {
    return null;
  }
}