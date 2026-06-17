import { proposals, metrics, auditEvents, workerHealth } from "../lib/sample-data.mjs";

const selected = proposals[0];

function PolicyChip({ decision }: { decision: string }) {
  if (decision === "blocked") return <span className="chip blocked">Blocked</span>;
  if (decision === "auto_safe") return <span className="chip auto">Auto-safe</span>;
  return <span className="chip approval">Approval required</span>;
}

export default function DashboardPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">RO</div>
          <div>
            <h1>{process.env.NEXT_PUBLIC_APP_NAME ?? "CRM Revenue Ops Agent Workflow"}</h1>
            <p>Policy-gated CRM next actions with audit-safe approvals</p>
          </div>
        </div>
        <div className="top-actions">
          <span className="status-dot" aria-label="Worker healthy" />
          <button className="button">Dead-letter queue</button>
          <button className="button primary">Review next</button>
        </div>
      </header>

      <section className="metrics" aria-label="Operational metrics">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </section>

      <section className="workspace">
        <aside className="panel" aria-label="Proposal queue">
          <div className="panel-header">
            <h2>Proposal queue</h2>
            <span className="chip approval">5 pending</span>
          </div>
          <div className="filter-row">
            <select aria-label="Status filter" defaultValue="pending">
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
              <option value="auto_safe">Auto-safe</option>
            </select>
            <select aria-label="Owner filter" defaultValue="all">
              <option value="all">All owners</option>
              <option value="ava">Ava Chen</option>
              <option value="miles">Miles Ortiz</option>
            </select>
          </div>
          <div className="queue-list">
            {proposals.map((proposal, index) => (
              <button className={`queue-item ${index === 0 ? "selected" : ""}`} key={proposal.id}>
                <h3>{proposal.title}</h3>
                <div className="queue-meta">
                  <span>{proposal.account}</span>
                  <PolicyChip decision={proposal.policyDecision} />
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel detail" aria-label="Selected proposal detail">
          <div className="detail-title">
            <div>
              <h2>{selected.title}</h2>
              <p>{selected.summary}</p>
            </div>
            <PolicyChip decision={selected.policyDecision} />
          </div>

          <div className="context-grid">
            <div className="context-card">
              <span>Account</span>
              <strong>{selected.account}</strong>
            </div>
            <div className="context-card">
              <span>Owner</span>
              <strong>{selected.owner}</strong>
            </div>
            <div className="context-card">
              <span>Confidence</span>
              <strong>{Math.round(selected.confidence * 100)}%</strong>
            </div>
            <div className="context-card">
              <span>Pipeline value</span>
              <strong>{selected.pipelineValue}</strong>
            </div>
          </div>

          <div className="section">
            <h3>Evidence</h3>
            <ul className="evidence-list">
              {selected.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="policy-box">
            <div>
              <strong>{selected.reasonCode}</strong>
              <p>{selected.policyRationale}</p>
            </div>
            <div className="approval-controls">
              <button className="button">Reject</button>
              <button className="button primary">Approve</button>
            </div>
          </div>
        </section>

        <aside className="panel timeline-wrap" aria-label="Audit timeline">
          <div className="panel-header">
            <h2>Audit trail</h2>
            <span className="chip auto">Live</span>
          </div>
          <ul className="timeline">
            {auditEvents.map((event) => (
              <li key={`${event.time}-${event.title}`}>
                <strong>{event.title}</strong>
                <span>{event.time} - {event.detail}</span>
              </li>
            ))}
          </ul>
          <div className="worker-card">
            <h3>Worker health</h3>
            {workerHealth.map((row) => (
              <div className="worker-row" key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
