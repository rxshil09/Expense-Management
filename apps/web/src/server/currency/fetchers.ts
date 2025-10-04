// Simple currency fetcher implementation
export interface ExchangeRates {
  [currency: string]: number;
}

export async function fetchLatestRates(baseCurrency = 'USD'): Promise<ExchangeRates> {
  try {
    // Mock implementation - replace with actual API call
    const mockRates: ExchangeRates = {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35,
    };
    
    return mockRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    throw new Error('Unable to fetch current exchange rates');
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  const rates = await fetchLatestRates();
  
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
  }
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / rates[fromCurrency];
  const convertedAmount = usdAmount * rates[toCurrency];
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}