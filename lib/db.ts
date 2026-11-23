import "server-only";
import { Pool } from "pg";

let pool: Pool | undefined;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function databasePool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Banco não configurado");
  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    query_timeout: 10_000,
    allowExitOnIdle: true,
  });
  // An idle connection can close when the Neon compute suspends.
  pool.on("error", () =>
    console.warn("Conexão ociosa ao PostgreSQL encerrada."),
  );
  return pool;
}

export async function queryValue(
  statement: string,
  params: readonly unknown[] = [],
): Promise<unknown> {
  const { rows } = await databasePool().query<{ value: unknown }>(statement, [
    ...params,
  ]);
  return rows[0]?.value;
}
