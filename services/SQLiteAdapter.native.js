import * as SQLite from 'expo-sqlite';

export async function openDatabaseAsync(name) {
  return SQLite.openDatabaseAsync(name);
}
