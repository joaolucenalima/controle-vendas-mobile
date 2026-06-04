import { PrinterRepository } from "./printer-repository";

function normalizeMacAddress(value: string): string {
  return value.trim().toUpperCase();
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
};

