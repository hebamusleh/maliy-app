import { supabase } from "./supabase";

/** Base currency for all analytics and reporting */
export const BASE_CURRENCY = "SAR";

/**
 * SAR-per-1-unit fallback rates (approximate, 2026).
 * Used when the DB cache is empty and the live API is unreachable.
 */
const FALLBACK_RATES: Record<string, number> = {
  SAR: 1.0,
  USD: 3.75,
  EUR: 4.10,
  GBP: 4.75,
  AED: 1.02,
  KWD: 12.20,
  BHD: 9.95,
  QAR: 1.03,
  OMR: 9.74,
  JOD: 5.29,
  EGP: 0.075,
  JPY: 0.025,
  CNY: 0.52,
  INR: 0.045,
  TRY: 0.11,
};

export const SUPPORTED_CURRENCIES: string[] = Object.keys(FALLBACK_RATES).sort();

/**
 * Returns SAR per 1 unit of `currency` on `date`.
 * Resolution order: DB cache → live API → hardcoded fallback.
 */
export async function getExchangeRate(currency: string, date: string): Promise<number> {
  if (currency === BASE_CURRENCY) return 1.0;

  // 1. DB cache (locked historical rates)
  const { data: cached } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("currency", currency)
    .eq("date", date)
    .maybeSingle();

  if (cached?.rate != null) return Number(cached.rate);

  // 2. Live API — exchangerate-api.com free tier (no key needed for v4)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/SAR`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as { rates: Record<string, number> };
      // API gives: rates[X] = how many X per 1 SAR → invert to get SAR per X
      const sarPerUnit = data.rates[currency] ? 1 / data.rates[currency] : null;

      // Cache all returned rates for today (ignore duplicates)
      const toCache = Object.entries(data.rates)
        .filter(([c, r]) => c !== BASE_CURRENCY && r > 0)
        .map(([c, r]) => ({ currency: c, rate: 1 / r, date, source: "api" }));
      if (toCache.length) {
        await supabase
          .from("exchange_rates")
          .upsert(toCache, { onConflict: "currency,date", ignoreDuplicates: true });
      }

      if (sarPerUnit != null) return sarPerUnit;
    }
  } catch {
    // API unreachable — fall through to hardcoded fallback
  }

  // 3. Hardcoded fallback
  return FALLBACK_RATES[currency] ?? 1.0;
}

/**
 * Convert an amount from `currency` to SAR using the given rate.
 * Preserves the sign (negative = expense, positive = income).
 */
export function toBaseCurrency(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Returns how many units of `baseCurrency` equal 1 SAR.
 * Used to convert stored SAR amounts to the user's chosen display currency.
 *
 * Example: baseCurrency = "USD", SAR/USD rate = 3.75
 *   → 1 SAR = 1/3.75 = 0.2667 USD
 */
export async function getSarToBaseRate(baseCurrency: string, date: string): Promise<number> {
  if (baseCurrency === BASE_CURRENCY) return 1.0;
  const sarPerBase = await getExchangeRate(baseCurrency, date);
  return sarPerBase > 0 ? 1 / sarPerBase : 1.0;
}

/**
 * Converts a SAR-denominated amount to the user's display currency.
 * `rate` should come from getSarToBaseRate().
 */
export function sarToDisplay(sarAmount: number, rate: number): number {
  return Math.round(sarAmount * rate * 100) / 100;
}

/** Currency code → human-readable label (Arabic) */
export const CURRENCY_LABELS: Record<string, string> = {
  SAR: "ريال سعودي",
  USD: "دولار أمريكي",
  EUR: "يورو",
  GBP: "جنيه إسترليني",
  AED: "درهم إماراتي",
  KWD: "دينار كويتي",
  BHD: "دينار بحريني",
  QAR: "ريال قطري",
  OMR: "ريال عُماني",
  JOD: "دينار أردني",
  EGP: "جنيه مصري",
  JPY: "ين ياباني",
  CNY: "يوان صيني",
  INR: "روبية هندية",
  TRY: "ليرة تركية",
};
