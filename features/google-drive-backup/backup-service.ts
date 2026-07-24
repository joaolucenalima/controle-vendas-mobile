import { BackupRepository } from "./backup-repository";
import { GoogleDriveClient } from "./google-drive-client";
import type { DriveBackupFile } from "./backup.types";

const MAX_BACKUPS = 5;

function createBackupName(createdAt: string) {
  const timestamp = createdAt.replace(/[:.]/g, "-");
  return `controle-vendas-${timestamp}.json`;
}

export type CreateBackupResult = {
  backup: DriveBackupFile;
  backups: DriveBackupFile[];
  cleanupWarning: boolean;
};

export const BackupService = {
  async listBackups(accessToken: string): Promise<DriveBackupFile[]> {
    return await GoogleDriveClient.listBackups(accessToken);
  },

  async createBackup(accessToken: string): Promise<CreateBackupResult> {
    const payload = await BackupRepository.exportData();
    const serializedBackup = JSON.stringify(payload);
    const backup = await GoogleDriveClient.uploadBackup(
      accessToken,
      createBackupName(payload.createdAt),
      serializedBackup,
    );

    let backups: DriveBackupFile[];
    let cleanupWarning = false;

    try {
      backups = await GoogleDriveClient.listBackups(accessToken);
    } catch {
      return { backup, backups: [backup], cleanupWarning: true };
    }

    for (const oldBackup of backups.slice(MAX_BACKUPS)) {
      try {
        await GoogleDriveClient.deleteBackup(accessToken, oldBackup.id);
        backups = backups.filter((item) => item.id !== oldBackup.id);
      } catch {
        cleanupWarning = true;
      }
    }

    try {
      backups = await GoogleDriveClient.listBackups(accessToken);
    } catch {
      cleanupWarning = true;
    }

    return { backup, backups, cleanupWarning };
  },

  async restoreBackup(accessToken: string, fileId: string): Promise<void> {
    const serializedBackup = await GoogleDriveClient.downloadBackup(accessToken, fileId);
    const payload = BackupRepository.parse(serializedBackup);
    await BackupRepository.restore(payload);
  },
};
