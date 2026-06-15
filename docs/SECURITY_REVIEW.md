# Security review

Date: 2026-06-12

## Scope

Reviewed the repository contents intended for first GitHub publication:

- Next.js API/dashboard code under `apps/web`
- Python worker logic under `services/engine`
- shared JSON contracts under `packages/shared`
- Docker Compose, CI, README, and publishing guide
- repository tooling under `tools`

## Threat model

Primary risks for this repo are:

- accidental commit of secrets or CRM/customer data
- unsafe external actions such as sending email or deleting CRM records
- duplicate processing from repeated external CRM events
- unaudited approval transitions
- poisoned or invalid queue messages

## Controls present

- `.gitignore` blocks `.env`, `.env.*`, local caches, logs, build output, and virtual environments.
- `.env.example` contains only safe local/demo values.
- `tools/security-check.mjs` scans for common secret patterns and forbidden env files.
- Policy logic blocks external sends and destructive CRM updates.
- Risky CRM changes require `requires_approval`.
- Idempotency keys are deterministic for repeated CRM events.
- Invalid worker payloads move to dead-letter handling.
- Approval decisions append audit events.

## Checks run

The following command passed locally:

```bash
npm.cmd run check
```

It executed:

- repository shape lint
- 4 Node tests
- 8 Python tests
- committed-secret scan
- npm dependency audit with moderate-or-higher threshold
- production web build
- Docker Compose config validation

## Findings

No publish-blocking security findings were identified.

Dependency note: the web app pins `next@16.3.0-canary.49` because the current stable Next release pulls a PostCSS version flagged by `npm audit`. The pinned canary uses PostCSS `8.5.10` and produced a clean audit at review time. Move back to stable once stable Next carries the patched PostCSS dependency.

## Publication notes

Before pushing future changes:

- run `npm run check`
- verify no `.env` file is staged
- never commit real CRM exports, lead lists, emails, tokens, or provider credentials
- store production credentials only in GitHub Actions Secrets or the deploy platform secret manager
