export function calculateSaleTotalInCents(subtotalInCents: number, discountInCents: number): number {
  return Math.max(subtotalInCents - discountInCents, 0);
}
