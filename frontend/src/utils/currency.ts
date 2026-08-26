/**
 * Brazilian currency (BRL) helpers.
 *
 * Design contract:
 *  - The React state always holds a CLEAN numeric value (e.g. 1234.56), so Axios
 *    sends a proper number to the Java backend (BigDecimal) with no parsing errors.
 *  - The MASKED string (e.g. "1.234,56") is only a display concern, derived on render.
 */

/**
 * Formats a clean numeric value into the Brazilian masked string.
 * @param value clean value, e.g. 1234.56
 * @returns e.g. "1.234,56" (empty string when there is no value)
 */
export const formatBRL = (value: number | string | null | undefined): string => {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Converts whatever the user typed into a clean numeric value, treating the
 * trailing two digits as cents ("digits-in-sequence" real-time mask behaviour).
 *
 * Example: typing "1", "12", "123", "1234", "123456" yields
 *          0.01, 0.12, 1.23, 12.34, 1234.56
 *
 * @param raw the raw input string (may contain dots, commas, R$, etc.)
 * @returns clean numeric value, or '' when there are no digits
 */
export const parseBRLDigits = (raw: string | null | undefined): number | '' => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10) / 100;
};
