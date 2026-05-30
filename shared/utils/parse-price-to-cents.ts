export function parsePriceToCents(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(/[^0-9.,]/g, "");
  if (!cleaned) return null;

  const normalized = cleaned.replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;

  const [whole, fractionRaw] = normalized.split(".");
  const wholeNumber = Number(whole);
  if (!Number.isFinite(wholeNumber)) return null;

  const fraction = (fractionRaw ?? "").padEnd(2, "0").slice(0, 2);
  const fractionNumber = fraction ? Number(fraction) : 0;
  if (!Number.isFinite(fractionNumber)) return null;

  return wholeNumber * 100 + fractionNumber;
}

export function parsePriceDigitsToCents(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;

  const cents = Number(digits);
  return Number.isFinite(cents) ? cents : 0;
}
