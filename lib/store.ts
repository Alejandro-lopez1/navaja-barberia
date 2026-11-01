import type { TabName } from "./types";

export interface RowStore {
  readTab(tab: TabName): Promise<string[][]>;
  appendRow(tab: TabName, values: string[]): Promise<void>;
  updateRow(tab: TabName, id: string, values: string[]): Promise<void>;
}

let cachedStore: RowStore | null = null;

export async function getStore(): Promise<RowStore> {
  if (cachedStore) return cachedStore;

  if (process.env.SHEETS_MOCK === "true") {
    const { localStore } = await import("./local-store");
    cachedStore = localStore;
  } else {
    const { sheetsStore } = await import("./sheets");
    cachedStore = sheetsStore;
  }

  return cachedStore;
}
