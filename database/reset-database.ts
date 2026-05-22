import { File, Paths } from "expo-file-system";
import { db } from "./sqlite";

const databasePaths = ["app.db", "app.db-wal", "app.db-shm"];

export async function deleteDatabaseFile() {
  const sqliteDirectory = new File(Paths.document, "SQLite");

  await db.closeAsync();

  await Promise.all(
    databasePaths.map(async (fileName) => {
      const databaseFile = new File(sqliteDirectory, fileName);

      if (databaseFile.exists) {
        databaseFile.delete();
      }
    }),
  );
}

export async function resetDatabase() {
  await deleteDatabaseFile();
}

