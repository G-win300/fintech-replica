import { useEffect, useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [ledger, setLedger] = useState([]);
  const [balances, setBalances] = useState({});

  const [fundId, setFundId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundError, setFundError] = useState("");
  const [fundBusy, setFundBusy] = useState(false);

  const [form, setForm] = useState({ from: "", to: "", amount: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLedger = useCallback(async () => {
    try {
      const r = await fetch(`${API}/ledger`);
      if (!r.ok) return;
      setLedger(await r.json());
    } catch {
      // ignore transient poll failures
    }
  }, []);

  useEffect(() => {
    fetchLedger();
    const id = setInterval(fetchLedger, 5000);
    return () => clearInterval(id);
  }, [fetchLedger]);

  // accounts-service returns { balance } for a known account, or
  // { error: "not found" } (still HTTP 200) for one that's never been funded.
  async function lookupBalance(id) {
    const r = await fetch(`${API}/accounts/${encodeURIComponent(id)}`);
    const body = await r.json();
    const balance = typeof body.balance === "number" ? body.balance : 0;
    setBalances((b) => ({ ...b, [id]: balance }));
    return balance;
  }

  async function handleCheckBalance(id) {
    if (!id) return;
    await lookupBalance(id);
  }

  async function handleFund(e) {
    e.preventDefault();
    setFundError("");
    setFundBusy(true);
    try {
      // POST /accounts/:id sets an absolute balance, so read the current
      // balance first and add to it, giving a natural "top up" feel.
      const current = await lookupBalance(fundId);
      const newBalance = current + Number(fundAmount);
      const r = await fetch(`${API}/accounts/${encodeURIComponent(fundId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Funding failed");
      setBalances((b) => ({ ...b, [fundId]: body.balance }));
      setFundAmount("");
    } catch (err) {
      setFundError(err.message);
    } finally {
      setFundBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: form.from,
          to: form.to,
          amount: Number(form.amount),
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Transfer failed");
      await Promise.all([
        fetchLedger(),
        lookupBalance(form.from),
        lookupBalance(form.to),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function BalanceHint({ id }) {
    if (!id || balances[id] === undefined) return null;
    return <small style={{ color: "#555" }}>Balance: {balances[id]}</small>;
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "2rem auto" }}>
      <h1>kuda-replica</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>1. Fund account</h2>
        <form onSubmit={handleFund} style={{ display: "grid", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              placeholder="Account id"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              onBlur={(e) => handleCheckBalance(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <BalanceHint id={fundId} />
          </div>
          <input
            placeholder="Amount to add"
            type="number"
            min="0"
            step="0.01"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            required
          />
          <button type="submit" disabled={fundBusy}>
            {fundBusy ? "Funding…" : "Add funds"}
          </button>
          {fundError && <p style={{ color: "crimson" }}>{fundError}</p>}
        </form>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>2. Transfer funds</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              placeholder="From account"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              onBlur={(e) => handleCheckBalance(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <BalanceHint id={form.from} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              placeholder="To account"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              onBlur={(e) => handleCheckBalance(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <BalanceHint id={form.to} />
          </div>
          <input
            placeholder="Amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send transfer"}
          </button>
          {error && <p style={{ color: "crimson" }}>{error}</p>}
        </form>
      </section>

      <section>
        <h2>3. Ledger</h2>
        <table width="100%" cellPadding="6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
              <th>Transaction</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((tx) => (
              <tr key={tx.transactionId} style={{ borderBottom: "1px solid #eee" }}>
                <td>{tx.transactionId.slice(0, 8)}</td>
                <td>{tx.from}</td>
                <td>{tx.to}</td>
                <td>{tx.amount}</td>
                <td>{tx.status}</td>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
