# CRM Revenue Ops Agent Workflow

Policy-gated CRM automation that validates, scores, and routes revenue events to human-approved proposed actions — with a complete audit trail and no destructive writes without explicit sign-off.

A Next.js API gateway accepts CRM-style webhooks, a deterministic Python engine scores each record and classifies the required action by risk tier, and every proposal that touches ownership, stage, or forecast waits in an approval queue before anything changes.

- **Idempotency at intake**: SHA-256 content hashing on the canonical event body means duplicate CRM webhooks are safe to replay — no double-processing, no silent data corruption
- **Three-tier policy enforcement**: `auto_safe`, `requires_approval`, and `blocked` are evaluated at the worker layer, not the dashboard — there is no UI path that bypasses policy
- **Immutable audit trail**: every state transition (event accepted, proposal created, approved, rejected) is written before the response returns

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker (for the full local stack with Postgres and Redis)

### Setup

```bash
git clone https://github.com/Daniel5569/revenue-ops-agent-workflow.git
cd revenue-ops-agent-workflow
npm install
cp .env.example .env
npm run dev
```

The dashboard is available at `http://localhost:3000`.

To start the complete local stack (Postgres + Redis + web app + Python engine):

```bash
docker compose up
```

Run all checks (lint, tests, security scan, build, Compose validation) in one command:

```bash
npm run check
```

### Expected output

```
▲ Next.js 16.3.0-canary.49 (webpack)
✓ Ready on http://localhost:3000
```

A valid event submission returns `202 Accepted`:

```json
{
  "id": "c7e2a1f0-3b44-4d9e-8c12-ff2091a3d84e",
  "idempotencyKey": "7f4a2c9d1e83b05a...",
  "jobId": "job_1",
  "proposalId": "proposal_7f4a2c9d1e83"
}
```

---

## Architecture

```
CRM webhook event
            │
            ▼
 ┌──────────────────────┐
 │   Next.js gateway    │  validate → idempotency check → enqueue
 │   (apps/web)         │
 └──────┬───────────────┘
        │                 ┌─────────────────────┐
        ├────────────────▶│    PostgreSQL        │
        │                 │  events, proposals,  │
        │                 │  audit log           │
        │                 └─────────────────────┘
        ▼
 ┌──────────────────────┐
 │    Redis Stream      │  async queue boundary
 └──────┬───────────────┘
        │
        ▼
 ┌──────────────────────┐
 │   Python worker      │
 │   ┌────────────────┐ │
 │   │ Scorer         │ │  segment, seniority, signals, staleness
 │   │ Policy engine  │ │  auto_safe / requires_approval / blocked
 │   │ Proposal gen   │ │  confidence score, reason code, target
 │   └────────────────┘ │
 └──────┬───────────────┘
        │
        ▼
 ┌──────────────────────┐        ┌──────────────────┐
 │   Approval queue     │───────▶│  Reviewer        │
 │   (pending proposals)│        │  approve/reject  │
 └──────────────────────┘        └────────┬─────────┘
                                           │
                                           ▼
                                    Audit event written
```

**Implementation note:** The Node.js layer uses in-memory storage (`store.mjs`, `queue.mjs`) so the repo runs without external services after `npm install`. The `infra/db/init.sql` schema and Docker Compose file describe the production topology where state is persisted to PostgreSQL and events are queued through Redis Streams.

### Stack

| Layer | Technology |
|---|---|
| API gateway + dashboard | Next.js 16, React 19, TypeScript |
| Worker + policy engine | Python 3.12 (stdlib only, no external deps) |
| Storage | PostgreSQL 16 |
| Queue | Redis 7 (Streams model) |
| Shared contracts | JSON Schema |
| Local stack | Docker Compose |
| CI | GitHub Actions |

---

## Key Features

**Content-addressed idempotency**
The idempotency key is a SHA-256 hash of the canonical event body — `source`, `externalRef`, `eventType`, and `payload` with object keys sorted. Repeated CRM webhooks for the same event produce the exact same key, so duplicates are caught at storage write time without any external state or locking.

**Three-tier policy engine**
Actions are classified as `auto_safe` (create internal task, add note), `requires_approval` (reassign owner, move opportunity stage, change forecast amount, merge contact), or `blocked` (send external email, delete CRM record, overwrite a closed status). Classification runs in the Python worker — the API routes have no override path.

**Dead-letter routing**
Events that fail validation or trigger an enqueue error are written to a dead-letter queue with a structured reason code rather than dropped silently. The DLQ is a first-class entity, not a log line.

**Stale pending recovery**
Worker jobs that exceed an idle threshold are reclaimed and reprocessed. The reclaim logic is deterministic and idempotent — replaying a stale job produces the same proposal as the original run.

**Approval-gated writes with pre-write audit**
Proposals awaiting human review expose `POST /approve` and `POST /reject` endpoints. Each decision is appended to the audit log before the updated proposal is returned — there is no way to record an approval without the audit entry being written first.

**Deterministic scoring without external services**
Lead scoring applies explicit rule weights: target segment match, buyer seniority tier, intent signals (pricing page, product docs), and opportunity staleness. No LLM calls, no third-party enrichment APIs, no rate limits. Every score is reproducible from the event payload alone, which makes tests fast and CI cheap.

---

## Project Structure

```
.
├── apps/web/                    # Next.js dashboard and API routes
│   ├── src/app/api/
│   │   ├── crm/events/          # POST: validate, deduplicate, enqueue
│   │   └── proposals/[id]/      # GET: fetch proposal
│   │       ├── approve/         # POST: approve with reviewer + reason
│   │       └── reject/          # POST: reject with reviewer + reason
│   ├── src/lib/                 # idempotency, validation, policy, proposals, store, queue, sample-data
│   └── tests/                   # Node test runner (4 integration tests)
├── services/engine/             # Python RevOps engine
│   ├── revops_engine/
│   │   ├── scorer.py            # Rule-based lead scoring
│   │   ├── policy.py            # Action classification (auto/approval/blocked)
│   │   └── worker.py            # Event processing, proposal gen, dead-letter
│   └── tests/                   # unittest suite (8 tests)
├── packages/shared/
│   └── contracts/               # JSON Schema for CRM events and proposed actions
├── infra/db/
│   └── init.sql                 # PostgreSQL schema: events, proposals, audit log
├── tools/                       # lint-repo, security-check, compose-check, python runner
├── docs/
│   └── SECURITY_REVIEW.md       # Pre-publication security review
├── .github/workflows/ci.yml     # CI: lint → test → security → build
├── docker-compose.yml           # Postgres 16, Redis 7, web, Python engine
├── LICENSE                      # MIT
└── .env.example                 # Environment variable reference
```

---

## API / Usage

### Submit a CRM event

```bash
curl -X POST http://localhost:3000/api/crm/events \
  -H "Content-Type: application/json" \
  -d '{
    "source": "hubspot-demo",
    "externalRef": "lead_4471",
    "eventType": "lead.created",
    "occurredAt": "2025-11-03T14:22:00Z",
    "payload": {
      "accountName": "Meridian Cloud",
      "domain": "meridiancloud.io",
      "segment": "b2b_saas",
      "employeeCount": 240,
      "seniority": "vp",
      "signals": ["pricing_page", "product_docs"],
      "consentStatus": "opted_in"
    }
  }'
```

**Response — `202 Accepted`:**

```json
{
  "id": "c7e2a1f0-3b44-4d9e-8c12-ff2091a3d84e",
  "idempotencyKey": "7f4a2c9d1e83b05a...",
  "jobId": "job_3",
  "proposalId": "proposal_7f4a2c9d1e83"
}
```

Submitting the same payload a second time returns `202` with `"duplicate": true` — no second proposal is created, no CRM state changes.

---

### Approve a proposal

```bash
curl -X POST http://localhost:3000/api/proposals/proposal_7f4a2c9d1e83/approve \
  -H "Content-Type: application/json" \
  -d '{
    "reviewer": "ops-lead@company.internal",
    "reason": "Confirmed VP-level inbound from target segment — assign to AE immediately"
  }'
```

**Response — `200 OK`:**

```json
{
  "id": "proposal_7f4a2c9d1e83",
  "actionType": "reassign_owner",
  "targetType": "lead",
  "targetId": "meridiancloud.io",
  "reasonCode": "HOT_INBOUND_SLA",
  "confidence": 0.98,
  "status": "approved",
  "policyDecision": "requires_approval",
  "payload": {
    "accountName": "Meridian Cloud",
    "evidence": ["Segment: b2b_saas", "Buyer seniority: vp", "Signals: pricing_page, product_docs"],
    "policyReasonCode": "HUMAN_APPROVAL_REQUIRED"
  }
}
```

---

## Configuration

| Variable | Description | Example | Required |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/revops` | Production |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | Production |
| `CRM_EVENT_STREAM` | Redis stream key for incoming events | `crm.events` | Production |
| `CRM_EVENT_DLQ_STREAM` | Redis stream key for dead-letter events | `crm.events.dead_letter` | Production |
| `APPROVAL_REVIEWER` | Default reviewer identity when none is supplied | `ops@company.internal` | No |
| `NEXT_PUBLIC_APP_NAME` | Dashboard title rendered in the browser | `CRM Revenue Ops Agent Workflow` | No |

`DATABASE_URL`, `REDIS_URL`, `CRM_EVENT_STREAM`, and `CRM_EVENT_DLQ_STREAM` are required when running the full Docker Compose stack. The in-memory demo (`npm install && npm run dev`) runs without them.

Copy `.env.example` to `.env` for local development. The `.env` file is gitignored and must never be committed.

---

## Why This Project Matters

Revenue operations teams at B2B SaaS companies lose pipeline to two failure modes: slow reaction to high-intent signals, and accidental destructive CRM writes — overwritten owners, duplicate leads, premature stage moves — that corrupt forecasts and erode rep trust in the system. Most automation tools address one or the other. This system treats CRM automation as a control problem: every proposed action is scored, classified by risk, and either executed automatically or held for human review, with every state transition logged before it is acknowledged. The architecture maps directly to what a production RevOps platform requires — an idempotent intake layer, a stateless policy engine that can be tested without infrastructure, and an approval queue where the human decision is the authoritative event, not an afterthought.
