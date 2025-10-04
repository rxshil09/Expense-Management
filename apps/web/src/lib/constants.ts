export const EXPENSE_CATEGORIES = [
  'Meals & Entertainment',
  'Transportation',
  'Office Supplies',
  'Travel',
  'Software & Subscriptions',
  'Training & Education',
  'Marketing',
  'Other',
] as const;

export const EXPENSE_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PROCESSING',
] as const;

export const USER_ROLES = [
  'ADMIN',
  'MANAGER',
  'EMPLOYEE',
] as const;

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf',
] as const;