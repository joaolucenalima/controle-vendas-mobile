import { PrinterRepository } from "./printer-repository";

export function normalizeMacAddress(value: string): string {
  const trimmed = value.trim();
  // iOS accessory identifiers are not necessarily MAC addresses.
  return /^([\da-f]{2}[:-]){5}[\da-f]{2}$/i.test(trimmed)
    ? trimmed.replace(/-/g, ":").toUpperCase()
    : trimmed;
}

export const PrinterService = {
  async getMacAddress(): Promise<string | null> {
    return await PrinterRepository.getMacAddress();
  },

  async saveMacAddress(value: string): Promise<string | null> {
    const normalized = normalizeMacAddress(value);

    if (!normalized) {
      await PrinterRepository.clearMacAddress();
      return null;
    }

    await PrinterRepository.upsertMacAddress(normalized);
    return normalized;
  },

  async getReceiptTitle(): Promise<string | null> {
    return await PrinterRepository.getReceiptTitle();
  },

  async saveReceiptTitle(value: string): Promise<string | null> {
    const trimmed = value.trim();

    return await PrinterRepository.saveReceiptTitle(trimmed);
  },
};
