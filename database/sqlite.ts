import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("app.db");

export async function configureDatabase() {
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
}

