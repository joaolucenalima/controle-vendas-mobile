import { db } from "@/database/sqlite";

const PRINTER_MAC_KEY = "printer_mac_address";

export const PrinterSettingsRepository = {
  async getMacAddress(): Promise<string | null> {
    const row = await db.getFirstAsync<{ value: string | null }>(
      "SELECT value FROM app_settings WHERE key = ?",
      [PRINTER_MAC_KEY],
    );

    return row?.value ?? null;
  },

  async setMacAddress(value: string | null): Promise<void> {
    const normalized = value?.trim().toUpperCase() ?? "";

    if (!normalized) {
      await db.runAsync("DELETE FROM app_settings WHERE key = ?", [PRINTER_MAC_KEY]);
      return;
    }

    await db.runAsync(
      "INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      [PRINTER_MAC_KEY, normalized, new Date().toISOString()],
    );
  },
};

