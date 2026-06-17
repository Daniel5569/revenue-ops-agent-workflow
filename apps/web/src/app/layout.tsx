import "./globals.css";

export const metadata = {
  title: "CRM Revenue Ops Agent Workflow",
  description: "Policy-gated CRM automation for B2B SaaS revenue teams — approval-gated actions, immutable audit trail, deterministic lead scoring.",
  openGraph: {
    title: "CRM Revenue Ops Agent Workflow",
    description: "Policy-gated CRM automation for B2B SaaS revenue teams — approval-gated actions, immutable audit trail, deterministic lead scoring.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CRM Revenue Ops Agent Workflow",
    description: "Policy-gated CRM automation for B2B SaaS revenue teams — approval-gated actions, immutable audit trail, deterministic lead scoring.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
