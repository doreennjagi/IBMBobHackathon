/**
 * Lightweight client-side checks before uploading (column names, size).
 * The API remains authoritative; this only improves perceived speed and messaging.
 */

export type CsvClientCheck = { ok: true } | { ok: false; message: string }

const MAX_BYTES = 10 * 1024 * 1024

const DATE_ALIASES = ['date', 'transaction_date', 'posting_date', 'value_date']
const MERCHANT_ALIASES = ['merchant', 'description', 'payee', 'details']
const AMOUNT_ALIASES = ['amount', 'debit', 'credit', 'value']

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_')
}

export function validateCsvFile(file: File): CsvClientCheck {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { ok: false, message: 'Please choose a file ending in .csv' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: 'File is larger than 10 MB. Export a smaller date range from your bank.' }
  }
  if (file.size === 0) {
    return { ok: false, message: 'This file is empty.' }
  }
  return { ok: true }
}

/** Parse first line of CSV text for header validation (sync, first ~8KB). */
export function validateCsvHeadersFromText(text: string): CsvClientCheck {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? ''
  if (!firstLine) {
    return { ok: false, message: 'CSV has no header row.' }
  }
  const headers = firstLine.split(',').map((h) => normalizeHeader(h.replace(/^"|"$/g, '')))
  const hasDate = headers.some((h) => DATE_ALIASES.includes(h))
  const hasMerchant = headers.some((h) => MERCHANT_ALIASES.includes(h))
  const hasAmount = headers.some((h) => AMOUNT_ALIASES.includes(h))
  if (!hasDate) {
    return {
      ok: false,
      message: "Missing a date column. Add a column named 'date' (or transaction_date / posting_date).",
    }
  }
  if (!hasMerchant) {
    return {
      ok: false,
      message: "Missing merchant/description. Add 'merchant' or 'description' column.",
    }
  }
  if (!hasAmount) {
    return {
      ok: false,
      message: "Missing amount column. Add 'amount' (or debit/credit) with numeric values.",
    }
  }
  return { ok: true }
}
