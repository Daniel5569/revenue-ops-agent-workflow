import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dockerConfigDir = mkdtempSync(join(tmpdir(), "revops-docker-config-"));

const result = spawnSync("docker", ["compose", "config", "--quiet"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DOCKER_CONFIG: dockerConfigDir
  }
});

if (result.error && result.error.code === "ENOENT") {
  console.log("Docker is not installed; skipping Compose config check.");
  process.exit(0);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Docker Compose config passed.");
