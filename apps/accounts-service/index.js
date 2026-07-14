const express = require("express");
const app = express();
app.use(express.json());

const DAPR = `http://localhost:${process.env.DAPR_HTTP_PORT || 3500}`;
const STORE = "kuda-statestore";

app.get("/healthz", (_, res) => res.send("ok"));

// Seed a balance
app.post("/accounts/:id", async (req, res) => {
  await fetch(`${DAPR}/v1.0/state/${STORE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ key: req.params.id, value: { balance: req.body.balance } }]),
  });
  res.json({ id: req.params.id, balance: req.body.balance });
});

app.get("/accounts/:id", async (req, res) => {
  const r = await fetch(`${DAPR}/v1.0/state/${STORE}/${req.params.id}`);
  res.json(r.status === 204 ? { error: "not found" } : await r.json());
});

app.post("/transfer", async (req, res) => {
  const { from, to, amount } = req.body;

  const r = await fetch(`${DAPR}/v1.0/state/${STORE}/${from}`);
  if (r.status === 204) return res.status(404).json({ error: "source account not found" });
  const src = await r.json();
  if (src.balance < amount) return res.status(400).json({ error: "insufficient funds" });

  await fetch(`${DAPR}/v1.0/state/${STORE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ key: from, value: { balance: src.balance - amount } }]),
  });

  // Service-to-service invocation → transactions-service
  const tx = await fetch(`${DAPR}/v1.0/invoke/transactions-service/method/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, amount }),
  });

  res.json(await tx.json());
});

app.listen(3000, () => console.log("accounts-service on :3000"));