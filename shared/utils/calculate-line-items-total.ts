type LineItem = {
  quantity: number;
  unitPriceInCents: number;
};

export function calculateSubtotalInCents(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPriceInCents, 0);
}
