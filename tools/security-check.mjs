import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", ".next", "security-scans"]);
const allowedFiles = new Set([".env.example", "PUBLISHING_GUIDE.md", "README.md", "package-lock.json"]);
const secretPatterns = [
  { name: "OpenAI API key", regex: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/ },
  { name: "GitHub token", regex: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
  { name: "AWS access key", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "Private key block", regex: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/ },
  { name: "Slack token", regex: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
  { name: "High-risk assignment", regex: /(api[_-]?key|secret|password|token)\s*=\s*["'][^"']{8,}["']/i }
];

const findings = [];

function shouldRead(file) {
  return /\.(js|mjs|ts|tsx|py|json|md|yml|yaml|sql|example|gitignore)$/i.test(file);
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relative = fullPath.slice(root.length + 1).replaceAll("\\", "/");
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (!ignoredDirs.has(entry)) walk(fullPath);
      continue;
    }

    if (entry.startsWith(".env") && !allowedFiles.has(entry)) {
      findings.push({ file: relative, issue: "Environment file must not be committed." });
      continue;
    }

    if (!shouldRead(entry) || stats.size > 500_000) continue;

    const text = readFileSync(fullPath, "utf8");
    for (const pattern of secretPatterns) {
      if (pattern.regex.test(text)) {
        if (allowedFiles.has(entry) && pattern.name === "High-risk assignment") continue;
        findings.push({ file: relative, issue: pattern.name });
      }
    }
  }
}

walk(root);

if (findings.length) {
  console.error(JSON.stringify(findings, null, 2));
  throw new Error("Security check failed.");
}

console.log("Security check passed: no committed secrets or forbidden env files found.");
