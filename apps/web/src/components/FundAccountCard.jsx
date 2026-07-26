import BalancePill from "./BalancePill.jsx";

export default function FundAccountCard({
  fundId,
  setFundId,
  fundAmount,
  setFundAmount,
  fundError,
  fundBusy,
  balances,
  onCheckBalance,
  onSubmit,
}) {
  return (
    <section className="card">
      <h2 className="card-title">
        <span className="step-badge">1</span>
        Fund account
      </h2>
      <p className="card-subtitle">Top up a balance before transferring from it.</p>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="fund-id">Account id</label>
          <div className="field-row">
            <input
              id="fund-id"
              placeholder="e.g. bob"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              onBlur={(e) => onCheckBalance(e.target.value)}
              required
            />
            <BalancePill id={fundId} balances={balances} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="fund-amount">Amount to add</label>
          <input
            id="fund-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            required
          />
        </div>

        <button className="btn-primary" type="submit" disabled={fundBusy}>
          {fundBusy ? "Funding…" : "Add funds"}
        </button>
        {fundError && <p className="error-text">{fundError}</p>}
      </form>
    </section>
  );
}
