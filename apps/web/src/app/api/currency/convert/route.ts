import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '../../../../server/auth/guard';
import { convertCurrency } from '../../../../server/currency/fetchers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amount = searchParams.get('amount');
    
    if (!from || !to || !amount) {
      return createApiError('Missing required parameters: from, to, amount', 400);
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return createApiError('Invalid amount', 400);
    }
    
    const convertedAmount = await convertCurrency(numericAmount, from, to);
    
    return createApiSuccess({
      from,
      to,
      originalAmount: numericAmount,
      convertedAmount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return createApiError(error.message, 400);
  }
}