import "dotenv/config";

import express from "express";

import authRouter from "./routes/authRoutes";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use("/v1/auth", authRouter);

app.get("/v1/health", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
