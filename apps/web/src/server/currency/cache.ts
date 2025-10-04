import { fetchLatestRates, ExchangeRates } from './fetchers';

interface CacheEntry {
  data: ExchangeRates;
  timestamp: number;
  ttl: number;
}

class CurrencyCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 60 * 60 * 1000; // 1 hour in milliseconds

  async getRates(baseCurrency = 'USD'): Promise<ExchangeRates> {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    // Cache miss or expired, fetch fresh data
    const rates = await fetchLatestRates(baseCurrency);
    
    this.cache.set(cacheKey, {
      data: rates,
      timestamp: Date.now(),
      ttl: this.defaultTTL,
    });
    
    return rates;
  }
  
  async refreshCache(baseCurrency = 'USD'): Promise<void> {
    const cacheKey = `rates_${baseCurrency}`;
    this.cache.delete(cacheKey);
    await this.getRates(baseCurrency);
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

export const currencyCache = new CurrencyCache();

// Background refresh every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    currencyCache.refreshCache().catch(console.error);
  }, 60 * 60 * 1000);
}