import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "pesca-test-"));
const cluster = join(root, "data");
let started = false;
let child;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child?.kill(signal));
}
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} exited with ${result.status}`);
}
try {
  run("initdb", [
    "-D",
    cluster,
    "-U",
    "pesca_test_owner",
    "--auth=trust",
    "--no-locale",
    "--encoding=UTF8",
  ]);
  run("pg_ctl", [
    "-D",
    cluster,
    "-l",
    join(root, "postgres.log"),
    "-o",
    `-k "${root}" -c listen_addresses=''`,
    "start",
  ]);
  started = true;
  const url = (role) =>
    `postgresql://${role}@localhost/postgres?host=${encodeURIComponent(root)}`;
  run("psql", [
    url("pesca_test_owner"),
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "tests/database/bootstrap.sql",
  ]);
  const migrate = () => run(process.execPath, ["scripts/migrate.mjs", "dev"], {
    ...process.env,
    DEV_ADMIN_DATABASE_URL: url("pesca_test_owner"),
  });
  migrate();
  if (process.argv[2] === "--e2e") {
    child = spawn(
      process.execPath,
      [
        "node_modules/@playwright/test/cli.js",
        "test",
        "--config",
        "playwright.rsvp.config.ts",
        ...process.argv.slice(3),
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: url("pesca_runtime"),
          PESCA_TEST_OWNER_URL: url("pesca_test_owner"),
        },
      },
    );
    process.exitCode = await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) => resolve(code ?? 1));
    });
  } else {
    migrate(); // Replaying a synchronized catalog must be a no-op.
    run("psql", [
      url("pesca_test_owner"),
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      "tests/database/rsvp.sql",
      "-f",
      "tests/database/beach.sql",
      "-f",
      "tests/database/characters.sql",
    ]);
  }
} finally {
  if (started) run("pg_ctl", ["-D", cluster, "-m", "fast", "stop"]);
  rmSync(root, { recursive: true, force: true });
}
