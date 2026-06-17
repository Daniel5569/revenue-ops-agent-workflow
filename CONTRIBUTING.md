# Contributing

Bug reports and pull requests are welcome.

## Setup

```bash
git clone https://github.com/Daniel5569/revenue-ops-agent-workflow.git
cd revenue-ops-agent-workflow
npm install
cp .env.example .env
npm run dev
```

## Before opening a PR

Run the full check suite — all steps must pass:

```bash
npm run check
```

This runs lint, Node tests, Python tests, security scan, dependency audit, production build, and Docker Compose validation in sequence.

## What belongs in a PR

- **Bug fixes** with a test that reproduces the issue
- **New action types** — add to both `apps/web/src/lib/policy.mjs` and `services/engine/revops_engine/policy.py` to keep the Node.js and Python policy engines symmetric
- **Schema changes** — update `packages/shared/contracts/` and `infra/db/init.sql` together
- **Documentation fixes** — always welcome

## What does not belong

- LLM integrations or external enrichment API calls — the Python engine is intentionally dependency-free and deterministic
- UI framework changes — the dashboard is a static Next.js page with plain CSS; keep it that way
- Breaking changes to the `/api/crm/events` or `/api/proposals/[id]` contracts without a version prefix

## Commit style

Plain imperative subject line, 72 characters or fewer:

```
fix: reject events missing idempotency key at intake
feat: add seniority tier for individual contributor contacts
docs: clarify dead-letter queue recovery behavior
```
