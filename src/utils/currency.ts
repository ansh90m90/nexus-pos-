import { StoreConfig } from '../types/pos';
import { COUNTRY_CURRENCY_PRESETS } from '../constants/countries';

/**
 * Format a number according to Indian or Standard numbering system.
 * Indian format: 12,34,567.89
 * Standard format: 1,234,567.89
 */
export function formatAmountOnly(amount: number, numberFormat: 'standard' | 'indian' = 'standard', decimals: number = 2): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return (0).toFixed(decimals);
  }

  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const fixedStr = absVal.toFixed(decimals);
  const [intPart, decPart] = fixedStr.split('.');

  let formattedInt = '';

  if (numberFormat === 'indian') {
    if (intPart.length <= 3) {
      formattedInt = intPart;
    } else {
      const lastThree = intPart.substring(intPart.length - 3);
      const otherNumbers = intPart.substring(0, intPart.length - 3);
      const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      formattedInt = formattedOthers + ',' + lastThree;
    }
  } else {
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const result = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  return isNegative ? `-${result}` : result;
}

/**
 * Format money with currency symbol and appropriate placement
 */
export function formatMoney(amount: number, config?: Partial<StoreConfig> | null): string {
  const symbol = config?.currency_symbol ?? '₹';
  const position = config?.currency_position ?? 'before';
  const numberFormat = config?.number_format ?? (symbol === '₹' || config?.country_code === 'IN' ? 'indian' : 'standard');

  const formattedNum = formatAmountOnly(amount, numberFormat, 2);

  if (position === 'after') {
    return `${formattedNum} ${symbol}`.trim();
  }
  return `${symbol}${formattedNum}`;
}

/**
 * Detect country flag or preset by config
 */
export function getStoreCountryInfo(config?: Partial<StoreConfig> | null) {
  if (!config) return COUNTRY_CURRENCY_PRESETS[0];

  if (config.country_code) {
    const match = COUNTRY_CURRENCY_PRESETS.find(c => c.id.toLowerCase() === config.country_code?.toLowerCase());
    if (match) return match;
  }

  if (config.currency_code) {
    const match = COUNTRY_CURRENCY_PRESETS.find(c => c.currencyCode.toLowerCase() === config.currency_code?.toLowerCase());
    if (match) return match;
  }

  if (config.currency_symbol) {
    const match = COUNTRY_CURRENCY_PRESETS.find(c => c.currencySymbol.trim() === config.currency_symbol?.trim());
    if (match) return match;
  }

  return COUNTRY_CURRENCY_PRESETS[0];
}
