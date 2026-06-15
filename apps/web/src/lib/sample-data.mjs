export const metrics = [
  { label: "Pending proposals", value: "5" },
  { label: "Auto-safe tasks", value: "12" },
  { label: "Blocked actions", value: "3" },
  { label: "SLA risk", value: "2" },
  { label: "Expected pipeline", value: "$418k" }
];

export const proposals = [
  {
    id: "prop_hot_inbound",
    title: "Hot inbound lead needs owner assignment",
    account: "Northstar Analytics",
    owner: "Ava Chen",
    confidence: 0.91,
    pipelineValue: "$84k",
    policyDecision: "requires_approval",
    reasonCode: "HOT_INBOUND_SLA",
    summary: "Pricing-page visit, senior buyer title, and target segment triggered a 15-minute follow-up proposal.",
    policyRationale: "Owner reassignment changes CRM ownership and requires human approval.",
    evidence: [
      "VP-level contact from target B2B SaaS segment",
      "Pricing page and product docs viewed within 18 minutes",
      "No open owner task exists for this account"
    ]
  },
  {
    id: "prop_stalled_opp",
    title: "Stalled opportunity risk review",
    account: "AtlasGrid",
    owner: "Miles Ortiz",
    confidence: 0.82,
    pipelineValue: "$126k",
    policyDecision: "auto_safe",
    reasonCode: "NO_ACTIVITY_14_DAYS",
    summary: "Opportunity has no activity inside the final two weeks before close date.",
    policyRationale: "Creating an internal follow-up task is auto-safe.",
    evidence: ["No activity for 14 days", "Close date in 11 days", "Stage is proposal"]
  },
  {
    id: "prop_duplicate_lead",
    title: "Duplicate lead merge suggestion",
    account: "VectorLoop",
    owner: "Ava Chen",
    confidence: 0.88,
    pipelineValue: "$42k",
    policyDecision: "requires_approval",
    reasonCode: "DUPLICATE_CONTACT_DOMAIN",
    summary: "Same domain and contact role arrived twice; no duplicate task should be created.",
    policyRationale: "Merging CRM records requires reviewer approval.",
    evidence: ["Matching domain", "Similar title", "Existing open lead found"]
  },
  {
    id: "prop_expansion",
    title: "Expansion signal review",
    account: "BrightLayer",
    owner: "Nia Patel",
    confidence: 0.76,
    pipelineValue: "$166k",
    policyDecision: "requires_approval",
    reasonCode: "EXPANSION_SIGNAL",
    summary: "Existing account activity indicates a possible expansion opportunity.",
    policyRationale: "Creating an expansion opportunity changes forecastable pipeline.",
    evidence: ["Multiple product-docs views", "Existing customer account", "New department activity"]
  },
  {
    id: "prop_unsafe_email",
    title: "External discount email blocked",
    account: "SummitIQ",
    owner: "Miles Ortiz",
    confidence: 0.99,
    pipelineValue: "$0",
    policyDecision: "blocked",
    reasonCode: "EXTERNAL_SEND_BLOCKED",
    summary: "Requested action would send an external discount email without approval.",
    policyRationale: "External sends are never executed by this workflow.",
    evidence: ["Action type send_external_email", "Discount language detected", "No approval event exists"]
  }
];

export const auditEvents = [
  { time: "09:30", title: "CRM event received", detail: "hubspot-demo lead.created accepted" },
  { time: "09:30", title: "Idempotency key written", detail: "No duplicate event found" },
  { time: "09:31", title: "Worker scored lead", detail: "Score 91 with HOT_INBOUND_SLA" },
  { time: "09:31", title: "Policy evaluated", detail: "requires_approval due to owner reassignment" },
  { time: "09:32", title: "Proposal created", detail: "Waiting for reviewer decision" }
];

export const workerHealth = [
  { label: "Stream lag", value: "4 jobs" },
  { label: "Dead-letter", value: "1 item" },
  { label: "Recovered stale pending", value: "2" },
  { label: "Last heartbeat", value: "18s ago" }
];
