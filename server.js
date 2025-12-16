import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import auditRoutes from "./routes/auditRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*", // later replace with frontend domain
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Audit Tool Backend Running");
});

app.use("/api/audit", auditRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
