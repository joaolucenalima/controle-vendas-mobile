import { create } from "zustand";

import { PrinterService } from "./printer-service";

type PrinterStoreState = {
  loadPrinterSettings: () => Promise<{ macAddress: string | null; receiptTitle: string | null }>;
  macAddress: string | null;
  loadMacAddress: () => Promise<string | null>;
  saveMacAddress: (value: string) => Promise<string | null>;
  receiptTitle: string | null;
  saveReceiptTitle: (value: string) => Promise<string | null>;
  loadReceiptTitle: () => Promise<string | null>;
};

export const usePrinterStore = create<PrinterStoreState>((set) => ({
  macAddress: null,
  receiptTitle: null,

  loadPrinterSettings: async () => {
    const [macAddress, receiptTitle] = await Promise.all([
      PrinterService.getMacAddress(),
      PrinterService.getReceiptTitle(),
    ]);
    set({ macAddress, receiptTitle });
    return { macAddress, receiptTitle };
  },

  loadMacAddress: async () => {
    const macAddress = await PrinterService.getMacAddress();
    set({ macAddress });
    return macAddress;
  },

  saveMacAddress: async (value) => {
    const macAddress = await PrinterService.saveMacAddress(value);
    set({ macAddress });
    return macAddress;
  },

  saveReceiptTitle: async (value) => {
    const receiptTitle = await PrinterService.saveReceiptTitle(value);
    set({ receiptTitle });
    return receiptTitle;
  },

  loadReceiptTitle: async () => {
    const receiptTitle = await PrinterService.getReceiptTitle();
    set({ receiptTitle });
    return receiptTitle;
  },
}));
