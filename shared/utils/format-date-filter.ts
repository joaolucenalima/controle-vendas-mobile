export function formatDateFilterKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateFilterKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function getTodayDateFilterKey(): string {
  return formatDateFilterKey(new Date());
}

export function soldAtIsoToDateFilterKey(iso: string): string {
  return formatDateFilterKey(new Date(iso));
}

export function dateFilterKeyToSoldAtIso(dateKey: string): string {
  const parsed = parseDateFilterKey(dateKey);
  if (!parsed) return new Date().toISOString();

  const localNoon = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    12,
    0,
    0,
    0,
  );
  return localNoon.toISOString();
}

export function formatDateFilterDisplay(value: string): string {
  const parsed = parseDateFilterKey(value);
  if (!parsed) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}
