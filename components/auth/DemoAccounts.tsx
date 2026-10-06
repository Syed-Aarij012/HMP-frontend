"use client";

/**
 * Local development only: one-click sign-in as each seeded demo persona (DevDataSeeder, password
 * "password"). `process.env.NODE_ENV` is fixed at build time, so a production build drops this
 * list entirely — no demo credentials ever ship.
 */
const DEMO_ACCOUNTS: { role: string; email: string }[] = [
  { role: "Super Admin", email: "superadmin@hmp.test" },
  { role: "Super Admin (second approver)", email: "superadmin2@hmp.test" },
  { role: "Private buyer", email: "buyer@hmp.test" },
  { role: "Private seller", email: "seller@hmp.test" },
  { role: "Trade buyer", email: "trader@hmp.test" },
  { role: "Dealer Org Admin + Group Admin", email: "marvin.okon@example.net" },
  { role: "Auctioneer", email: "auctioneer@hmp.test" },
  { role: "Inspector + Quality Supervisor", email: "inspector@hmp.test" },
  { role: "Customer Support", email: "support@hmp.test" },
  { role: "Trust & Safety", email: "trustsafety@hmp.test" },
  { role: "Finance Operations", email: "financeops@hmp.test" },
];

export default function DemoAccounts({ onPick }: { onPick: (email: string, password: string) => void }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <details className="hmp-auth-demo">
      <summary>Demo accounts (local development only)</summary>
      <p className="fs-13 text-color-1 mb-2">Every demo account uses the password <code>password</code>. Click one to sign in as it.</p>
      <div className="hmp-auth-demo-grid">
        {DEMO_ACCOUNTS.map((account) => (
          <button key={account.email} type="button" onClick={() => onPick(account.email, "password")}>
            <b>{account.role}</b>
            <span>{account.email}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
