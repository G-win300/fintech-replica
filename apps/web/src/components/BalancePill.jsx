export default function BalancePill({ id, balances }) {
  if (!id || balances[id] === undefined) return null;
  return <span className="balance-pill">{balances[id]}</span>;
}
