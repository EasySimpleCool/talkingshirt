import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const VENV_PY = join(ROOT, ".venv", "bin", "python");
const VENV_PIP = join(ROOT, ".venv", "bin", "pip");

function ensureVenv() {
  if (existsSync(VENV_PY)) return;

  console.error("Creating design-audit venv…");
  const create = spawnSync("python3", ["-m", "venv", ".venv"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (create.status !== 0) process.exit(create.status ?? 1);

  const install = spawnSync(VENV_PIP, ["install", "-q", "-r", "requirements.txt"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (install.status !== 0) process.exit(install.status ?? 1);
}

ensureVenv();

const args = ["scripts/run_audit.py", ...process.argv.slice(2)];
const run = spawnSync(VENV_PY, args, { cwd: ROOT, stdio: "inherit" });
process.exit(run.status ?? 1);
