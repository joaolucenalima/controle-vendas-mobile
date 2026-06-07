import { PrinterRepository } from "./printer-repository";

function normalizeMacAddress(value: string): string {
  return value.replace(/-/g, ":").trim().toUpperCase();
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
