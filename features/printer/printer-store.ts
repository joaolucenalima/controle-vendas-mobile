import { create } from "zustand";

import { PrinterService } from "./printer-service";

type PrinterStoreState = {
  macAddress: string | null;
  loadMacAddress: () => Promise<string | null>;
  saveMacAddress: (value: string) => Promise<string | null>;
};

export const usePrinterStore = create<PrinterStoreState>((set) => ({
  macAddress: null,

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
}));

