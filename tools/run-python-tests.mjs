import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const candidates = [];
if (process.env.PYTHON) candidates.push(process.env.PYTHON);
if (process.env.USERPROFILE) {
  const codexPython = join(
    process.env.USERPROFILE,
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "python",
    "python.exe"
  );
  if (existsSync(codexPython)) candidates.push(codexPython);
}
candidates.push("python", "python3", "py");

let last;
for (const candidate of candidates) {
  const args = candidate === "py"
    ? ["-3", "-m", "unittest", "discover", "services/engine/tests"]
    : ["-m", "unittest", "discover", "services/engine/tests"];
  const result = spawnSync(candidate, args, {
    encoding: "utf8",
    env: {
      ...process.env,
      PYTHONPATH: "services/engine"
    }
  });

  last = result;
  if (!result.error && result.status === 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exit(0);
  }
}

if (last?.error) {
  console.error(last.error.message);
}
process.exit(last?.status ?? 1);
