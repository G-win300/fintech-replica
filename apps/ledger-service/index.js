const express = require("express");
const { Pool } = require("pg");
const app = express();
// Dapr delivers pub/sub events as CloudEvents with Content-Type
// application/cloudevents+json, which express.json() ignores by default.
app.use(express.json({ type: "*/*" }));

// Reads PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE from env automatically.
const pool = new Pool({ ssl: { rejectUnauthorized: false } });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id BIGSERIAL PRIMARY KEY,
      transaction_id TEXT UNIQUE NOT NULL,
      from_account TEXT NOT NULL,
      to_account TEXT NOT NULL,
      amount NUMERIC(18,2) NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `);
}

app.get("/healthz", (_, res) => res.send("ok"));

// Route declared in the Subscription CRD
app.post("/events/transaction-created", async (req, res) => {
  // Dapr delivers a CloudEvent; the payload is under .data
  const tx = req.body.data ?? req.body;
  try {
    await pool.query(
      `INSERT INTO ledger_entries
         (transaction_id, from_account, to_account, amount, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (transaction_id) DO NOTHING`,
      [tx.transactionId, tx.from, tx.to, tx.amount, tx.status, tx.createdAt]
    );
    res.status(200).json({ status: "SUCCESS" });   // SUCCESS | RETRY | DROP
  } catch (err) {
    console.error("ledger insert failed", err);
    res.status(200).json({ status: "RETRY" });
  }
});

app.get("/ledger", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT transaction_id AS "transactionId", from_account AS "from",
           to_account AS "to", amount, status, created_at AS "createdAt"
    FROM ledger_entries ORDER BY created_at DESC LIMIT 50
  `);
  res.json(rows);
});

ensureSchema()
  .then(() => app.listen(3000, () => console.log("ledger-service on :3000")))
  .catch((err) => {
    console.error("schema init failed", err);
    process.exit(1);
  });
