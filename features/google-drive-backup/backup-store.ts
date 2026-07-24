import { create } from "zustand";

import { BackupService, type CreateBackupResult } from "./backup-service";
import type { BackupOperationStatus, DriveBackupFile } from "./backup.types";

type BackupStoreState = {
  backups: DriveBackupFile[];
  status: BackupOperationStatus;
  listBackups: (accessToken: string) => Promise<DriveBackupFile[]>;
  createBackup: (accessToken: string) => Promise<CreateBackupResult>;
  restoreBackup: (accessToken: string, fileId: string) => Promise<void>;
  reset: () => void;
};

export const useBackupStore = create<BackupStoreState>((set) => ({
  backups: [],
  status: "idle",

  listBackups: async (accessToken) => {
    set({ status: "listing" });
    try {
      const backups = await BackupService.listBackups(accessToken);
      set({ backups });
      return backups;
    } finally {
      set({ status: "idle" });
    }
  },

  createBackup: async (accessToken) => {
    set({ status: "creating" });
    try {
      const result = await BackupService.createBackup(accessToken);
      set({ backups: result.backups });
      return result;
    } finally {
      set({ status: "idle" });
    }
  },

  restoreBackup: async (accessToken, fileId) => {
    set({ status: "restoring" });
    try {
      await BackupService.restoreBackup(accessToken, fileId);
    } finally {
      set({ status: "idle" });
    }
  },

  reset: () => set({ backups: [], status: "idle" }),
}));

