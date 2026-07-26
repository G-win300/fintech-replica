export default function Header() {
  return (
    <div className="header">
      <div className="brand">
        <div className="brand-mark">KR</div>
        <div>
          <h1>kuda-replica</h1>
          <p>fintech microservices demo</p>
        </div>
      </div>
      <div className="live-indicator">
        <span className="live-dot" />
        Live · updates every 5s
      </div>
    </div>
  );
}
