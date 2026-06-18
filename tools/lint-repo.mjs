import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "README.md",
  ".env.example",
  ".gitignore",
  "docker-compose.yml",
  ".github/workflows/ci.yml",
  "apps/web/src/app/page.tsx",
  "apps/web/src/app/api/crm/events/route.ts",
  "services/engine/revops_engine/worker.py",
  "infra/db/init.sql",
  "packages/shared/contracts/crm-event.schema.json"
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
if (missing.length) {
  throw new Error(`Missing required files: ${missing.join(", ")}`);
}

for (const contract of [
  "packages/shared/contracts/crm-event.schema.json",
  "packages/shared/contracts/proposed-action.schema.json"
]) {
  JSON.parse(readFileSync(join(root, contract), "utf8"));
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
for (const script of ["check", "test:node", "test:python", "security:scan", "compose:check"]) {
  if (!packageJson.scripts?.[script]) {
    throw new Error(`package.json is missing script: ${script}`);
  }
}

const forbiddenNames = [".env", "id_rsa", "credentials.json"];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const relative = path.slice(root.length + 1).replaceAll("\\", "/");
    if (relative.startsWith(".git/") || relative.startsWith("node_modules/")) continue;
    if (forbiddenNames.includes(entry)) {
      throw new Error(`Forbidden file name present: ${relative}`);
    }
    if (statSync(path).isDirectory()) walk(path);
  }
}

walk(root);
console.log("Repo shape lint passed.");