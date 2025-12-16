import express from "express";
import { auditWebsite } from "../controllers/auditController.js";

const router = express.Router();

router.post("/", auditWebsite);

export default router;
