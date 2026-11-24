import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const [environment, flag, baseline, ...extra] = process.argv.slice(2);
if (
  !["dev", "production"].includes(environment) || extra.length ||
  (flag !== undefined && (flag !== "--baseline" || !baseline))
) {
  throw new Error("Usage: migrate.mjs dev|production [--baseline NNN_name.sql]");
}
const production = environment === "production";
const variable = production ? "ADMIN_DATABASE_URL" : "DEV_ADMIN_DATABASE_URL";
if (!process.env[variable]) throw new Error(`Set ${variable} to the direct owner connection.`);

const directory = new URL("../db/", import.meta.url);
const filenames = readdirSync(directory).filter(name => name.endsWith(".sql")).sort();
if (!filenames.length) throw new Error("No SQL migrations found.");
const migrations = filenames.map((name, index) => {
  if (!/^\d{3}_[a-z0-9_]+\.sql$/.test(name) || Number(name.slice(0, 3)) !== index + 1) {
    throw new Error(`Expected consecutive numbered migrations, found ${name}`);
  }
  const sql = readFileSync(new URL(name, directory), "utf8");
  return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
});
const baselineIndex = migrations.findIndex(m => m.name === baseline);
if (baseline && baselineIndex < 0) throw new Error("Unknown baseline file.");

const client = new pg.Client({ connectionString: process.env[variable], connectionTimeoutMillis: 10000 });
try {
  await client.connect();
  await client.query("BEGIN");
  const { rows: [target] } = await client.query(`
    SELECT current_database() AS db, current_setting('neon.project_id', true) AS project,
           current_setting('neon.branch_id', true) AS branch
  `);
  const isProduction =
    target.project === "quiet-waterfall-79162856" &&
    target.branch === "br-fragrant-lake-be7ise18" &&
    target.db === "neondb";
  if (production !== isProduction) {
    throw new Error("Connected database does not match the selected environment.");
  }
  console.log(`Migrating ${environment}: ${target.branch ?? "local"}/${target.db}`);

  await client.query("SET LOCAL lock_timeout = '15s'");
  await client.query("SELECT pg_advisory_xact_lock(hashtext('pesca.schema_migrations'))");
  const { rows: [state] } = await client.query(`
    SELECT to_regnamespace('pesca') IS NOT NULL AS installed,
           to_regclass('pesca.schema_migrations') IS NOT NULL AS tracked
  `);
  if (baseline && (!state.installed || state.tracked)) {
    throw new Error("Baseline requires an existing, untracked schema.");
  }
  if (state.installed && !state.tracked && !baseline) {
    throw new Error("Compare the legacy schema before choosing --baseline.");
  }

  const history = state.tracked
    ? (await client.query("SELECT name, checksum FROM pesca.schema_migrations ORDER BY name")).rows
    : [];
  for (const [i, row] of history.entries()) {
    if (migrations[i]?.name !== row.name || migrations[i].checksum !== row.checksum) {
      throw new Error(`Migration history differs at ${row.name}.`);
    }
  }
  for (let index = history.length; index < migrations.length; index++) {
    const migration = migrations[index];
    if (index > baselineIndex) await client.query(migration.sql);
    if (index === 0) {
      await client.query(`CREATE TABLE pesca.schema_migrations (
        name text PRIMARY KEY, checksum text NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now()
      )`);
      await client.query("REVOKE ALL ON pesca.schema_migrations FROM PUBLIC, pesca_runtime");
    }
    await client.query("INSERT INTO pesca.schema_migrations (name, checksum) VALUES ($1, $2)", [
      migration.name, migration.checksum,
    ]);
    console.log(`${index <= baselineIndex ? "Baselined" : "Applied"} ${migration.name} (pending commit)`);
  }
  await client.query("COMMIT");
  console.log(`Schema current at ${migrations.at(-1).name}.`);
} catch (error) {
  // Closing the connection also rolls back an interrupted migration.
  console.error(error.code ?? "Migration failed", error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]"));
  process.exitCode = 1;
} finally {
  await client.end();
}
