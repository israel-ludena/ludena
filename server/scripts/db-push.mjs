// Sincroniza el esquema de Prisma con la base SQLite usando el motor de esquema en WebAssembly.
// No necesita descargar binarios de Prisma, así que funciona en entornos sin acceso a binaries.prisma.sh.
// Uso: node scripts/db-push.mjs [--force]
// En una máquina normal también se puede usar `pnpm exec prisma db push`.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { bindMigrationAwareSqlAdapterFactory } from "@prisma/driver-adapter-utils";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const enginePath = require.resolve("@prisma/schema-engine-wasm");
const { SchemaEngine } = await import(enginePath);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en server/.env");
  process.exit(1);
}

const schemaPath = path.resolve(here, "../prisma/schema.prisma");
const schema = fs.readFileSync(schemaPath, "utf8");
const force = process.argv.includes("--force");

const adapter = bindMigrationAwareSqlAdapterFactory(new PrismaBetterSqlite3({ url }));
const engine = await SchemaEngine.new({ datamodels: [["schema.prisma", schema]] }, () => {}, adapter);
const result = await engine.schemaPush({
  schema: { files: [{ path: "schema.prisma", content: schema }] },
  force,
  filters: { externalTables: [], externalEnums: [] },
});

if (result.unexecutable.length || (result.warnings.length && !force)) {
  console.error("No se aplicó el esquema:");
  for (const w of [...result.unexecutable, ...result.warnings]) console.error(" -", w);
  console.error("Revisa los avisos. Para aplicar igual (puede perder datos): node scripts/db-push.mjs --force");
  process.exit(1);
}
console.log(`Esquema aplicado (${result.executedSteps} pasos).`);
process.exit(0);
