import { useEffect, useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [ledger, setLedger] = useState([]);
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
      await fetchLedger();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "2rem auto" }}>
      <h1>kuda-replica</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.5rem", marginBottom: "2rem" }}>
        <h2>Transfer</h2>
        <input
          placeholder="From account"
          value={form.from}
          onChange={(e) => setForm({ ...form, from: e.target.value })}
          required
        />
        <input
          placeholder="To account"
          value={form.to}
          onChange={(e) => setForm({ ...form, to: e.target.value })}
          required
        />
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

      <h2>Ledger</h2>
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
    </div>
  );
}
