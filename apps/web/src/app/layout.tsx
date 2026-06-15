import "./globals.css";

export const metadata = {
  title: "CRM Revenue Ops Agent Workflow",
  description: "Approval-gated RevOps agent dashboard for CRM pipeline automation."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
