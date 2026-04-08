import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let lastHealthCheckAt = 0;
let writeQueue: Promise<void> = Promise.resolve();

const DB_NAME = 'stkizito.db';
const HEALTH_CHECK_INTERVAL_MS = 5000;

const isRecoverableDatabaseError = (error: unknown) => {
    const message = String(error ?? '').toLowerCase();
    return (
        message.includes('nativedatabase.prepareasync') ||
        message.includes('nullpointerexception') ||
        message.includes('database is closed') ||
        message.includes('statement has been finalized')
    );
};

const resetDb = async () => {
    const currentDb = db;
    db = null;
    dbInitPromise = null;
    lastHealthCheckAt = 0;

    if (!currentDb) return;

    try {
        await currentDb.closeAsync();
    } catch {
        // Best effort: if close fails, we'll still reopen a fresh connection.
    }
};

export const getDb = async () => {
    if (db) {
        try {
            const now = Date.now();
            if (now - lastHealthCheckAt >= HEALTH_CHECK_INTERVAL_MS) {
                await db.getFirstAsync('SELECT 1 as ok');
                lastHealthCheckAt = now;
            }
            return db;
        } catch (error) {
            if (!isRecoverableDatabaseError(error)) {
                throw error;
            }
            await resetDb();
        }
    }

    if (!dbInitPromise) {
        dbInitPromise = (async () => {
            const nextDb = await SQLite.openDatabaseAsync(DB_NAME);
            await setupDatabase(nextDb);
            db = nextDb;
            lastHealthCheckAt = Date.now();
            return nextDb;
        })().catch(async (error) => {
            await resetDb();
            throw error;
        });
    }

    return dbInitPromise;
};

export const withDb = async <T>(
    operation: (database: SQLite.SQLiteDatabase) => Promise<T>,
    operationName = 'SQLite operation'
) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const database = await getDb();
            return await operation(database);
        } catch (error) {
            const isRetryable = attempt === 0 && isRecoverableDatabaseError(error);
            if (!isRetryable) throw error;

            console.warn(`[SQLite] ${operationName} failed, reopening database and retrying once.`, error);
            await resetDb();
        }
    }

    throw new Error(`[SQLite] ${operationName} failed after retry.`);
};

export const withDbWriteTransaction = async <T>(
    operation: (database: SQLite.SQLiteDatabase) => Promise<T>,
    operationName = 'SQLite write transaction'
) => {
    const run = async () =>
        withDb(async (database) => {
            await database.execAsync('BEGIN IMMEDIATE');
            let committed = false;
            try {
                const result = await operation(database);
                await database.execAsync('COMMIT');
                committed = true;
                return result;
            } catch (error) {
                try {
                    if (!committed) {
                        const inTransaction = await database.isInTransactionAsync();
                        if (inTransaction) {
                            await database.execAsync('ROLLBACK');
                        }
                    }
                } catch (rollbackError) {
                    console.warn(`[SQLite] Rollback failed in ${operationName}.`, rollbackError);
                }
                throw error;
            }
        }, operationName);

    const next = writeQueue.then(run, run);
    writeQueue = next.then(
        () => undefined,
        () => undefined
    );
    return next;
};

const setupDatabase = async (database: SQLite.SQLiteDatabase) => {
    await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS announcements_cache (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      type TEXT,
      published INTEGER,
      created_at TEXT,
      synced_at INTEGER
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS events_cache (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      location TEXT,
      synced_at INTEGER
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS mass_times_cache (
      id TEXT PRIMARY KEY,
      day_of_week TEXT,
      time TEXT,
      location TEXT,
      type TEXT,
      synced_at INTEGER
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS payment_details_cache (
      id TEXT PRIMARY KEY,
      bank_name TEXT,
      account_name TEXT,
      account_number TEXT,
      synced_at INTEGER
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_bookings (
      local_id TEXT PRIMARY KEY,
      data_json TEXT,
      created_at INTEGER
    );
  `);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_donations (
      local_id TEXT PRIMARY KEY,
      data_json TEXT,
      created_at INTEGER
    );
  `);
};
