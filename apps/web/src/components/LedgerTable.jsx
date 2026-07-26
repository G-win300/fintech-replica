function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(iso).toLocaleString();
}

export default function LedgerTable({ ledger }) {
  return (
    <section className="card ledger-card">
      <h2 className="card-title">
        <span className="step-badge">3</span>
        Ledger
      </h2>
      <p className="card-subtitle">Every settled transaction, newest first.</p>

      {ledger.length === 0 ? (
        <div className="empty-state">No transactions yet — send a transfer to see it here.</div>
      ) : (
        <div className="ledger-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((tx) => (
                <tr key={tx.transactionId}>
                  <td className="mono">{tx.transactionId.slice(0, 8)}</td>
                  <td>{tx.from}</td>
                  <td>{tx.to}</td>
                  <td>{tx.amount}</td>
                  <td>
                    <span className={`badge ${tx.status.toLowerCase()}`}>{tx.status}</span>
                  </td>
                  <td className="mono">{timeAgo(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
