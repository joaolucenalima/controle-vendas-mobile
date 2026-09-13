import { create } from "zustand";
import type { BluetoothDevice } from "react-native-bluetooth-classic";
import { PrinterService, normalizeMacAddress } from "./printer-service";
import { PrinterBluetooth, PrinterConnectionError, type ConnectionStatus } from "./printer-bluetooth";

type Settings = { macAddress: string | null; receiptTitle: string | null };
type PrinterStoreState = Settings & {
  connectionStatus: ConnectionStatus;
  connectedPrinter: { address: string; name: string } | null;
  connectionError: string | null;
  printStatus: "idle" | "printing" | "success" | "error";
  printError: string | null;
  isBusy: boolean;
  loadPrinterSettings: () => Promise<Settings>;
  loadMacAddress: () => Promise<string | null>;
  saveMacAddress: (value: string) => Promise<string | null>;
  saveReceiptTitle: (value: string) => Promise<string | null>;
  loadReceiptTitle: () => Promise<string | null>;
  refreshConnection: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  print: (payload: string) => Promise<void>;
  resetPrintResult: () => void;
  startMonitoring: () => () => void;
};
const message = (error: unknown) => error instanceof Error ? error.message : "Não foi possível acessar a impressora.";

export const usePrinterStore = create<PrinterStoreState>((set, get) => {
  let device: BluetoothDevice | null = null;
  let revision = 0;
  let connection: Promise<void> | null = null;
  let settings: Promise<Settings> | null = null;
  let stopMonitoring: (() => void) | null = null;
  let observers = 0;
  let pendingRefresh = false;

  function fail(error: unknown) {
    device = null;
    set({ connectionStatus: error instanceof PrinterConnectionError ? error.status : "error", connectionError: message(error), connectedPrinter: null });
  }
  async function establish() {
    const { macAddress } = await get().loadPrinterSettings();
    if (!macAddress) throw new PrinterConnectionError("unconfigured", "Configure a impressora antes de conectar.");
    const current = ++revision;
    set({ connectionStatus: "connecting", connectionError: null });
    await PrinterBluetooth.ready(true);
    const connected = await PrinterBluetooth.connected(macAddress) ?? await PrinterBluetooth.connect(macAddress);
    if (current !== revision || get().macAddress !== macAddress) {
      await connected.disconnect();
      throw new Error("A conexão mudou. Tente novamente.");
    }
    device = connected;
    set({ connectionStatus: "connected", connectedPrinter: { address: connected.address, name: connected.name }, connectionError: null });
  }
  async function finish() {
    set({ isBusy: false });
    if (pendingRefresh) { pendingRefresh = false; await get().refreshConnection(); }
  }
  return {
    macAddress: null, receiptTitle: null, connectionStatus: "unknown", connectedPrinter: null,
    connectionError: null, printStatus: "idle", printError: null, isBusy: false,
    loadPrinterSettings: () => {
      settings ??= Promise.all([PrinterService.getMacAddress(), PrinterService.getReceiptTitle()])
        .then(([macAddress, receiptTitle]) => { set({ macAddress, receiptTitle }); return { macAddress, receiptTitle }; })
        .catch(error => { settings = null; throw error; });
      return settings;
    },
    loadMacAddress: async () => (await get().loadPrinterSettings()).macAddress,
    loadReceiptTitle: async () => {
      const receiptTitle = await PrinterService.getReceiptTitle();
      set({ receiptTitle });
      return receiptTitle;
    },
    saveReceiptTitle: async value => {
      await get().loadPrinterSettings();
      const receiptTitle = await PrinterService.saveReceiptTitle(value);
      set({ receiptTitle });
      settings = Promise.resolve({ macAddress: get().macAddress, receiptTitle });
      return receiptTitle;
    },
    saveMacAddress: async value => {
      if (get().isBusy) throw new Error("Aguarde a operação da impressora terminar.");
      set({ isBusy: true });
      try {
        await get().loadPrinterSettings();
        const normalized = normalizeMacAddress(value) || null;
        const previous = get().macAddress;
        if (normalized === previous) return previous;
        ++revision;
        if (previous) {
          set({ connectionStatus: "disconnecting" });
          await PrinterBluetooth.disconnect(previous);
        }
        const macAddress = await PrinterService.saveMacAddress(value);
        device = null;
        set({ macAddress, connectedPrinter: null, connectionStatus: macAddress ? "disconnected" : "unconfigured", connectionError: null, printStatus: "idle", printError: null });
        settings = Promise.resolve({ macAddress, receiptTitle: get().receiptTitle });
        return macAddress;
      } catch (error) { fail(error); throw error; }
      finally { await finish(); }
    },
    refreshConnection: async () => {
      if (get().isBusy) { pendingRefresh = true; return; }
      const current = ++revision;
      set({ connectionStatus: "unknown" });
      try {
        const { macAddress } = await get().loadPrinterSettings();
        if (current !== revision) return;
        if (!macAddress) { set({ connectionStatus: "unconfigured", connectedPrinter: null, connectionError: null }); return; }
        const connected = await PrinterBluetooth.connected(macAddress);
        if (current !== revision || get().isBusy) return;
        device = connected;
        set({ connectionStatus: connected ? "connected" : "disconnected", connectedPrinter: connected ? { address: connected.address, name: connected.name } : null, connectionError: null });
      } catch (error) { if (current === revision && !get().isBusy) fail(error); }
    },
    connect: () => {
      if (connection) return connection;
      if (get().isBusy) return Promise.resolve();
      set({ isBusy: true });
      connection = establish().catch(fail).finally(async () => { connection = null; await finish(); });
      return connection;
    },
    disconnect: async () => {
      if (get().isBusy) return;
      set({ isBusy: true, connectionStatus: "disconnecting", connectionError: null });
      ++revision;
      try {
        const address = get().macAddress;
        if (address) await PrinterBluetooth.disconnect(address);
        device = null;
        set({ connectionStatus: address ? "disconnected" : "unconfigured", connectedPrinter: null });
      } catch (error) { fail(error); }
      finally { await finish(); }
    },
    print: async payload => {
      if (get().isBusy) return;
      set({ isBusy: true, printStatus: "idle", printError: null });
      let writing = false;
      try {
        await establish();
        const target = device;
        if (!target) throw new Error("Impressora desconectada.");
        writing = true;
        set({ printStatus: "printing" });
        if (!(await target.write(payload))) throw new Error("Não foi possível enviar o recibo. Confira a impressora antes de tentar novamente.");
        set({ printStatus: "success" });
      } catch (error) {
        if (!writing) fail(error);
        set({ printStatus: "error", printError: message(error) });
      } finally {
        if (writing) pendingRefresh = true;
        await finish();
      }
    },
    resetPrintResult: () => {
      if (!get().isBusy) set({ printStatus: "idle", printError: null });
    },
    startMonitoring: () => {
      observers++;
      if (!stopMonitoring) {
        try {
          const refresh = () => { void get().refreshConnection(); };
          const dropped = (status: "disconnected" | "bluetoothOff") => {
            ++revision;
            device = null;
            set({ connectionStatus: status, connectedPrinter: null, connectionError: status === "bluetoothOff" ? "Ative o Bluetooth nos ajustes do sistema." : null });
          };
          stopMonitoring = PrinterBluetooth.subscribe((address, connected) => {
            if (address !== get().macAddress) return;
            if (!connected) dropped("disconnected");
            refresh();
          }, enabled => {
            if (!enabled && get().macAddress) dropped("bluetoothOff");
            refresh();
          });
        } catch (error) { fail(error); }
        void get().refreshConnection();
      }
      let stopped = false;
      return () => {
        if (stopped) return;
        stopped = true;
        if (--observers === 0) { stopMonitoring?.(); stopMonitoring = null; ++revision; }
      };
    },
  };
});
