const express = require("express");
const app = express();
app.use(express.json());

app.get("/healthz", (_, res) => res.send("ok"));

// Route declared in the Subscription CRD
app.post("/events/transaction-created", (req, res) => {
  // Dapr delivers a CloudEvent; the payload is under .data
  const tx = req.body.data ?? req.body;
  console.log(`NOTIFY: ${tx.transactionId} — ${tx.amount} from ${tx.from} to ${tx.to}`);
  res.status(200).json({ status: "SUCCESS" });   // SUCCESS | RETRY | DROP
});

app.listen(3000, () => console.log("notifications-service on :3000"));