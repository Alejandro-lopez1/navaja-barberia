import { google, type sheets_v4 } from "googleapis";
import type { RowStore } from "./store";
import { SHEET_HEADERS, TABS, type TabName } from "./types";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let client: sheets_v4.Sheets | null = null;
let initPromise: Promise<void> | null = null;

function columnLetter(count: number): string {
  let n = count;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result || "A";
}

function spreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) {
    throw new Error(
      "Falta GOOGLE_SPREADSHEET_ID. Configurá la variable de entorno o usá SHEETS_MOCK=true.",
    );
  }
  return id;
}

function getClient(): sheets_v4.Sheets {
  if (client) return client;

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (credentialsPath) {
    const auth = new google.auth.GoogleAuth({
      scopes: SCOPES,
      keyFile: credentialsPath,
    });
    client = google.sheets({ version: "v4", auth });
    return client;
  }

  if (!email || !privateKey) {
    throw new Error(
      "Faltan credenciales de Google. Definí GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY, " +
        "GOOGLE_APPLICATION_CREDENTIALS, o usá SHEETS_MOCK=true para desarrollo local.",
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });
  client = google.sheets({ version: "v4", auth });
  return client;
}

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initialize().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

async function initialize(): Promise<void> {
  const sheets = getClient();
  const id = spreadsheetId();
  const tabs = Object.values(TABS);

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: id,
    fields: "sheets.properties.title",
  });

  const existing = new Set(
    (meta.data.sheets ?? [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)),
  );

  const missing = tabs.filter((tab) => !existing.has(tab));

  if (missing.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: {
        requests: missing.map((title) => ({
          addSheet: { properties: { title } },
        })),
      },
    });
  }

  for (const tab of tabs) {
    const headers = SHEET_HEADERS[tab];
    const lastCol = columnLetter(headers.length);
    const current = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${tab}!A1:${lastCol}1`,
    });

    const firstRow = current.data.values?.[0] ?? [];
    if (firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: id,
        range: `${tab}!A1:${lastCol}1`,
        valueInputOption: "RAW",
        requestBody: { values: [[...headers]] },
      });
    }
  }
}

function normalizeRow(tab: TabName, row: string[]): string[] {
  const width = SHEET_HEADERS[tab].length;
  return Array.from({ length: width }, (_, i) => row[i] ?? "");
}

export const sheetsStore: RowStore = {
  async readTab(tab) {
    await ensureInitialized();
    const sheets = getClient();
    const id = spreadsheetId();
    const lastCol = columnLetter(SHEET_HEADERS[tab].length);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${tab}!A1:${lastCol}`,
    });

    const rows = response.data.values ?? [];
    return rows.map((row) => normalizeRow(tab, row.map(String)));
  },

  async appendRow(tab, values) {
    await ensureInitialized();
    const sheets = getClient();
    const id = spreadsheetId();

    await sheets.spreadsheets.values.append({
      spreadsheetId: id,
      range: `${tab}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [normalizeRow(tab, values)] },
    });
  },

  async updateRow(tab, idTurno, values) {
    await ensureInitialized();
    const sheets = getClient();
    const id = spreadsheetId();

    const ids = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${tab}!A2:A`,
    });

    const rows = ids.data.values ?? [];
    const index = rows.findIndex((row) => row[0] === idTurno);

    if (index === -1) {
      throw new Error(`No se encontró el registro ${idTurno} en ${tab}.`);
    }

    const rowNumber = index + 2;
    const lastCol = columnLetter(SHEET_HEADERS[tab].length);

    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${tab}!A${rowNumber}:${lastCol}${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [normalizeRow(tab, values)] },
    });
  },
};

export async function initSheets(): Promise<void> {
  await ensureInitialized();
}
