import { useEffect, useState, useCallback } from "react";
import Header from "./components/Header.jsx";
import FundAccountCard from "./components/FundAccountCard.jsx";
import TransferCard from "./components/TransferCard.jsx";
import LedgerTable from "./components/LedgerTable.jsx";

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

  return (
    <div className="page">
      <Header />
      <div className="layout">
        <div className="stack">
          <FundAccountCard
            fundId={fundId}
            setFundId={setFundId}
            fundAmount={fundAmount}
            setFundAmount={setFundAmount}
            fundError={fundError}
            fundBusy={fundBusy}
            balances={balances}
            onCheckBalance={handleCheckBalance}
            onSubmit={handleFund}
          />
          <TransferCard
            form={form}
            setForm={setForm}
            error={error}
            submitting={submitting}
            balances={balances}
            onCheckBalance={handleCheckBalance}
            onSubmit={handleSubmit}
          />
        </div>
        <LedgerTable ledger={ledger} />
      </div>
    </div>
  );
}
