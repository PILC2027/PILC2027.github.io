export const DISCOUNTS = [20, 50, 100];
export function normalizeCode(value) { return String(value || '').trim().toUpperCase(); }
export function validCode(value) { return /^P(20|50|100)[A-Z]{3}$/.test(value); }
export function generateCode(percent) {
  if (!DISCOUNTS.includes(percent)) throw new Error('Invalid discount');
  let suffix = '';
  while (suffix.length < 3) {
    const values = crypto.getRandomValues(new Uint8Array(8));
    for (const value of values) if (value < 234 && suffix.length < 3) suffix += String.fromCharCode(65 + value % 26);
  }
  return `P${percent}${suffix}`;
}
export function discountedFee(base, percent) { return Math.round(base * (100 - percent)) / 100; }
