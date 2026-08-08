// type="number" already blocks most non-numeric keystrokes at the browser
// level, but paste and cross-browser inconsistencies can still leave a
// string-backed numeric field (see FormField's `prefix` usage) holding
// something odd. These strip that down to exactly what's valid to type,
// character by character, so the field never displays something Number()
// can't parse cleanly.

/** Digits, at most one decimal point, and (if allowed) a single leading
 * minus sign -- for dollar-amount and similar decimal fields. */
export function sanitizeNumericInput(raw: string, allowNegative = false): string {
  const negative = allowNegative && raw.trim().startsWith('-')
  const digitsAndDot = raw.replace(/[^0-9.]/g, '')
  const firstDot = digitsAndDot.indexOf('.')
  const cleaned =
    firstDot === -1
      ? digitsAndDot
      : digitsAndDot.slice(0, firstDot + 1) + digitsAndDot.slice(firstDot + 1).replace(/\./g, '')
  return negative ? `-${cleaned}` : cleaned
}

/** Digits only -- for day-count fields (invite/settings expiration, custom
 * recurrence interval) where a decimal point never makes sense. */
export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/[^0-9]/g, '')
}
