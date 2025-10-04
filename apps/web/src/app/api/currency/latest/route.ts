import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '../../../../server/auth/guard';
import { currencyCache } from '../../../../server/currency/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseCurrency = searchParams.get('base') || 'USD';
    
    const rates = await currencyCache.getRates(baseCurrency);
    
    return createApiSuccess({
      base: baseCurrency,
      rates,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return createApiError('Failed to fetch exchange rates', 500);
  }
}