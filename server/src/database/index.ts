import envConfig from "@/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

// Prisma 7 se conecta mediante un adaptador (sin binarios de Rust).
// Para PostgreSQL se cambiará por @prisma/adapter-pg.
const adapter = new PrismaBetterSqlite3({ url: envConfig.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log: ["info"],
});

export default prisma;
