import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
    if (db) return db;
    db = await SQLite.openDatabaseAsync('stkizito.db');
    await setupDatabase(db);
    return db;
};

const setupDatabase = async (database: SQLite.SQLiteDatabase) => {
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS readings (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      lectionary_number INTEGER,
      feast_name TEXT,
      liturgical_season TEXT,
      liturgical_color TEXT,
      first_reading_ref TEXT,
      first_reading_text TEXT,
      psalm_ref TEXT,
      psalm_text TEXT,
      second_reading_ref TEXT,
      second_reading_text TEXT,
      gospel_acclamation TEXT,
      gospel_ref TEXT,
      gospel_text TEXT,
      synced_at INTEGER
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS divine_office (
      id TEXT PRIMARY KEY,
      prayer_key TEXT NOT NULL,
      date TEXT,
      content_json TEXT NOT NULL,
      synced_at INTEGER
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS liturgical_calendar (
      date TEXT PRIMARY KEY,
      season TEXT,
      color TEXT,
      feast_name TEXT,
      feast_rank TEXT,
      saint TEXT
    );
  `);
};