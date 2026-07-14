const express = require("express");
const app = express();
app.use(express.json());

const DAPR = `http://localhost:${process.env.DAPR_HTTP_PORT || 3500}`;

app.get("/healthz", (_, res) => res.send("ok"));

// Public entrypoint: POST /transfer
app.post("/transfer", async (req, res) => {
  const r = await fetch(`${DAPR}/v1.0/invoke/accounts-service/method/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
});

app.listen(3000, () => console.log("gateway-api on :3000"));