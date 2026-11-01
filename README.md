# NAVAJA

Sistema mobile-first para administrar la agenda, caja y comisiones de una barbería. Permite gestionar turnos y descuentos, registrar el medio de pago utilizado y consultar reportes. No procesa pagos.

## Funcionalidades

- Agenda diaria con filtros por barbero y estado.
- Alta, edición y detalle de turnos.
- Estados de turno, registro de cambios y control de solapamientos.
- Catálogo de barberos, servicios y promociones.
- Descuentos porcentuales o fijos y cálculo de comisiones.
- Caja diaria y reportes por período.
- Google Sheets como persistencia y un modo local JSON para desarrollo.
- Acceso de administrador con PIN.

## Tecnologías

- Next.js 15, React 19 y TypeScript
- Tailwind CSS
- Google Sheets API v4
- Zod

## Requisitos

- Node.js 20 o superior
- npm
- Para persistencia real: una planilla de Google Sheets y una service account con acceso de edición

## Ejecutar localmente

### Modo local (sin Google Cloud)

```powershell
npm ci
Copy-Item .env.example .env.local
```

En `.env.local`, configurá:

```env
SHEETS_MOCK=true
APP_PIN=
AUTH_SECRET=
```

Después, iniciá la app:

```powershell
npm run seed
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El seed carga datos de demostración si la base local está vacía. La base local se guarda en `.data/db.json`.

> El modo mock es solo para desarrollo. No uses datos personales de clientes en un entorno o archivo que vayas a publicar.

### Con Google Sheets

1. En Google Cloud, habilitá **Google Sheets API** y creá una service account.
2. Creá una planilla y compartila con el email de la service account, con permiso Editor.
3. En `.env.local`, configurá el ID de la planilla y una de estas opciones:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_PRIVATE_KEY`.
   - `GOOGLE_APPLICATION_CREDENTIALS` con la ruta a un JSON de credenciales local.
4. Ejecutá `npm run init-sheets` para crear las pestañas y encabezados.
5. Ejecutá `npm run dev`.

La app crea estas pestañas si faltan: `Config_Barberos`, `Config_Servicios`, `Config_Promos`, `Turnos` y `Log_Cambios`. No cambies el orden ni los nombres de sus columnas.

## Variables de entorno

| Variable | Uso |
|---|---|
| `GOOGLE_SPREADSHEET_ID` | ID de la planilla de Google Sheets |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email de la service account, si no se usa un archivo JSON |
| `GOOGLE_PRIVATE_KEY` | Clave privada de la service account; acepta saltos de línea reales o `\n` escapados |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta local al JSON de la service account, alternativa a las dos variables anteriores |
| `APP_PIN` | PIN de administrador; obligatorio en producción |
| `AUTH_SECRET` | Secreto para firmar la cookie; obligatorio en producción y de al menos 32 caracteres |
| `ADMIN_NAME` | Nombre que aparece en el registro de cambios (predeterminado: `Admin`) |
| `CURRENCY` | Moneda para los importes (predeterminado: `ARS`) |
| `APP_TIMEZONE` | Zona horaria del servidor (predeterminada: `America/Argentina/Buenos_Aires`) |
| `NEXT_PUBLIC_CURRENCY` | Moneda usada por los formatos del navegador, si se configura |
| `NEXT_PUBLIC_TIMEZONE` | Zona horaria usada por los formatos del navegador, si se configura |
| `SHEETS_MOCK` | `true` para usar el JSON local durante desarrollo |
| `LOCAL_DB_PATH` | Ruta alternativa para la base JSON local |

`.env.example` contiene solo valores vacíos o de ejemplo. Completá los secretos en `.env.local` y nunca los subas al repositorio.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción local |
| `npm run typecheck` | Verificación de TypeScript |
| `npm test` | Tests de reglas de dominio |
| `npm run init-sheets` | Crear/verificar pestañas y encabezados |
| `npm run seed` | Cargar datos de demostración si corresponde |

## Reglas principales

- Solo los turnos completados cuentan como ingresos y generan comisión.
- Para completar un turno hay que registrar el método de pago.
- Turnos cancelados o marcados como “No asistió” no generan comisión.
- Los turnos activos del mismo barbero no pueden superponerse.
- La comisión fija configurada para un barbero tiene prioridad sobre la porcentual.
- Los descuentos requieren un motivo y el precio final nunca es negativo.

## Pruebas y build

```bash
npm test
npm run typecheck
npm run build
```

## Despliegue en Vercel

1. Importá el repositorio en Vercel.
2. Configurá las variables de Google Sheets, `APP_PIN` y `AUTH_SECRET` en el entorno **Production**.
3. Compartí la planilla con la service account como Editor.
4. Para Preview, usá una planilla y credenciales de prueba separadas.
5. No configures `SHEETS_MOCK=true` en Production.

No agregues al repositorio archivos de credenciales, variables `.env`, bases `.data` ni datos reales. El acceso a Google Sheets se realiza desde el servidor; sus credenciales no deben tener el prefijo `NEXT_PUBLIC_`.

## Estructura

```text
app/          Páginas y API routes
components/   Componentes de interfaz
lib/          Dominio, persistencia, autenticación y reportes
scripts/      Inicialización de Sheets y datos demo
spec.md       Especificación funcional
design.md     Arquitectura y diseño
```

## Alcance y limitaciones

NAVAJA está pensado para un administrador y una barbería de bajo volumen. No incluye cobros, facturación, mensajería, múltiples sucursales ni transacciones distribuidas. Los registros no se eliminan físicamente: las configuraciones se desactivan.
