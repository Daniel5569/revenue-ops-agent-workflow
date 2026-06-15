CREATE TABLE IF NOT EXISTS crm_sources (
  id BIGSERIAL PRIMARY KEY,
  source_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_events (
  id UUID PRIMARY KEY,
  source_id BIGINT REFERENCES crm_sources(id),
  external_ref TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  segment TEXT NOT NULL,
  employee_count INTEGER NOT NULL,
  lifecycle_state TEXT NOT NULL DEFAULT 'prospect'
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email_domain TEXT NOT NULL,
  seniority TEXT NOT NULL,
  consent_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  stage TEXT NOT NULL,
  value_cents INTEGER NOT NULL,
  close_date DATE NOT NULL,
  owner TEXT NOT NULL,
  health_score INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id),
  type TEXT NOT NULL,
  summary TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS proposed_actions (
  id UUID PRIMARY KEY,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  confidence NUMERIC(4, 3) NOT NULL,
  status TEXT NOT NULL,
  policy_decision TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_events (
  id UUID PRIMARY KEY,
  proposed_action_id UUID REFERENCES proposed_actions(id),
  reviewer TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO crm_sources (source_key, provider)
VALUES ('hubspot-demo', 'hubspot')
ON CONFLICT (source_key) DO NOTHING;
