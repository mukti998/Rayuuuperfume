/** Format a price value as Ethiopian Birr, e.g. 1200 → "1,200 Birr" */
export function formatPrice(value: number): string {
  return `${value.toLocaleString()} Birr`;
}
