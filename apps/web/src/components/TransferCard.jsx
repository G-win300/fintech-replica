import BalancePill from "./BalancePill.jsx";

export default function TransferCard({
  form,
  setForm,
  error,
  submitting,
  balances,
  onCheckBalance,
  onSubmit,
}) {
  return (
    <section className="card">
      <h2 className="card-title">
        <span className="step-badge">2</span>
        Transfer funds
      </h2>
      <p className="card-subtitle">Move money between two accounts.</p>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="from">From account</label>
          <div className="field-row">
            <input
              id="from"
              placeholder="e.g. alice"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              onBlur={(e) => onCheckBalance(e.target.value)}
              required
            />
            <BalancePill id={form.from} balances={balances} />
          </div>
        </div>

        <div className="transfer-arrow">↓</div>

        <div className="field">
          <label htmlFor="to">To account</label>
          <div className="field-row">
            <input
              id="to"
              placeholder="e.g. bob"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              onBlur={(e) => onCheckBalance(e.target.value)}
              required
            />
            <BalancePill id={form.to} balances={balances} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
        </div>

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send transfer"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
    </section>
  );
}
