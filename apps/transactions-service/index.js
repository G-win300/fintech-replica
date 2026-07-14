const express = require("express");
const crypto = require("crypto");
const app = express();
app.use(express.json());

const DAPR = `http://localhost:${process.env.DAPR_HTTP_PORT || 3500}`;
const PUBSUB = "kuda-pubsub";
const TOPIC = "transactions";

app.get("/healthz", (_, res) => res.send("ok"));

app.post("/transactions", async (req, res) => {
  const event = {
    transactionId: crypto.randomUUID(),
    ...req.body,
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
  };

  await fetch(`${DAPR}/v1.0/publish/${PUBSUB}/${TOPIC}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  console.log("published", event.transactionId);
  res.status(201).json(event);
});

app.listen(3000, () => console.log("transactions-service on :3000"));