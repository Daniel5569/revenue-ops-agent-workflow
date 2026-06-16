# Publishing Guide

Steps to release a new version of CRM Revenue Ops Agent Workflow to a production or staging environment.

---

## Prerequisites

- Docker and Docker Compose installed on the target host
- A PostgreSQL 16 instance reachable from the host
- A Redis 7 instance reachable from the host
- Node.js 20+ (for the Next.js build step if not using Docker)
- Python 3.12+ (for the engine service if not using Docker)

---

## 1. Environment variables

Copy `.env.example` and fill in all required values before deploying:

```bash
cp .env.example .env
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `CRM_EVENT_STREAM` | Yes | Redis stream key for incoming events |
| `CRM_EVENT_DLQ_STREAM` | Yes | Redis stream key for dead-letter events |
| `APPROVAL_REVIEWER` | No | Fallback reviewer identity |
| `NEXT_PUBLIC_APP_NAME` | No | Dashboard title |

The `.env` file must **never** be committed to the repository.

---

## 2. Database migration

Apply the schema to your PostgreSQL instance:

```bash
psql "$DATABASE_URL" -f infra/db/init.sql
```

The script is idempotent (`CREATE TABLE IF NOT EXISTS`) — safe to run on an existing database.

---

## 3. Run all checks before releasing

```bash
npm run check
```

This runs lint, Node tests, Python tests, security scan, Next.js build, and Docker Compose validation in sequence. All checks must pass before tagging a release.

---

## 4. Docker Compose (recommended for production)

Build and start the full stack:

```bash
docker compose --env-file .env up --build -d
```

Services started:

| Service | Port | Description |
|---|---|---|
| `web` | 3000 | Next.js API gateway + dashboard |
| `engine` | — | Python RevOps worker (no exposed port) |
| `postgres` | 5432 | PostgreSQL 16 |
| `redis` | 6379 | Redis 7 |

Check that all containers are healthy:

```bash
docker compose ps
```

---

## 5. Manual build (without Docker)

### Next.js web app

```bash
npm install
npm run build
npm start
```

### Python engine

```bash
cd services/engine
python -m revops_engine.worker
```

---

## 6. Verifying the deployment

Submit a test event and confirm a `202 Accepted` response:

```bash
curl -X POST http://localhost:3000/api/crm/events \
  -H "Content-Type: application/json" \
  -d '{
    "source": "deploy-check",
    "externalRef": "smoke_001",
    "eventType": "lead.created",
    "occurredAt": "2025-01-01T00:00:00Z",
    "payload": {
      "accountName": "Smoke Test Co",
      "domain": "smoketest.internal",
      "segment": "b2b_saas",
      "employeeCount": 50,
      "seniority": "manager",
      "signals": [],
      "consentStatus": "opted_in"
    }
  }'
```

Expected response body contains `"jobId"` and `"proposalId"`. A duplicate submission of the same payload must return `"duplicate": true` with no new proposal created.

---

## 7. Tagging a release

```bash
git tag -a v<version> -m "Release v<version>"
git push origin v<version>
```

Follow [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

- **PATCH** — bug fixes, no schema changes
- **MINOR** — new features, backwards-compatible schema additions
- **MAJOR** — breaking API changes or destructive schema migrations

---

## 8. Rolling back

To roll back to a previous image tag:

```bash
docker compose down
git checkout v<previous-version>
docker compose --env-file .env up --build -d
```

If the rollback includes a schema downgrade, restore the database from a snapshot taken before the migration — the `init.sql` script does not include `DOWN` migrations.
