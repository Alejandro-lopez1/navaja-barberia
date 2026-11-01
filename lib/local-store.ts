import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RowStore } from "./store";
import { SHEET_HEADERS, TABS, type TabName } from "./types";

type Database = Record<TabName, string[][]>;

const filePath =
  process.env.LOCAL_DB_PATH || path.join(process.cwd(), ".data", "db.json");

let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}

function emptyDatabase(): Database {
  const db = {} as Database;
  for (const tab of Object.values(TABS)) {
    db[tab] = [[...SHEET_HEADERS[tab]]];
  }
  return db;
}

async function load(): Promise<Database> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    const db = emptyDatabase();
    for (const tab of Object.values(TABS)) {
      if (Array.isArray(parsed[tab]) && parsed[tab]!.length > 0) {
        db[tab] = parsed[tab]!;
      }
    }
    return db;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const db = emptyDatabase();
    await save(db);
    return db;
  }
}

async function save(db: Database): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(db, null, 2), "utf8");
}

function normalizeRow(tab: TabName, row: string[]): string[] {
  const width = SHEET_HEADERS[tab].length;
  return Array.from({ length: width }, (_, i) => row[i] ?? "");
}

export const localStore: RowStore = {
  readTab(tab) {
    return withLock(async () => {
      const db = await load();
      return db[tab].map((row) => normalizeRow(tab, row.map(String)));
    });
  },

  appendRow(tab, values) {
    return withLock(async () => {
      const db = await load();
      db[tab].push(normalizeRow(tab, values));
      await save(db);
    });
  },

  updateRow(tab, id, values) {
    return withLock(async () => {
      const db = await load();
      const index = db[tab].findIndex((row, i) => i > 0 && row[0] === id);
      if (index === -1) {
        throw new Error(`No se encontró el registro ${id} en ${tab}.`);
      }
      db[tab][index] = normalizeRow(tab, values);
      await save(db);
    });
  },
};

export async function initLocalStore(): Promise<void> {
  await withLock(async () => {
    await load();
  });
}
