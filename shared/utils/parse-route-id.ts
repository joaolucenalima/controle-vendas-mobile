export function parseRouteId(id: string | undefined): number | null {
  if (!id) return null;

  const numeric = Number(id);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
}
