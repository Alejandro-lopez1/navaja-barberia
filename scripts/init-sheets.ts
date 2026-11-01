import "./env";
import { initLocalStore } from "../lib/local-store";
import { initSheets } from "../lib/sheets";

async function main() {
  if (process.env.SHEETS_MOCK === "true") {
    await initLocalStore();
    console.log("Modo local: base creada/verificada en .data/db.json");
    return;
  }

  await initSheets();
  console.log("Pestañas y encabezados creados/verificados en Google Sheets.");
}

main().catch((error) => {
  console.error("No se pudo inicializar la base:", error);
  process.exit(1);
});
