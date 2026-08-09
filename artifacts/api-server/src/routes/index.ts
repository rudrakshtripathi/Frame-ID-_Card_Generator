// @ts-nocheck
import { Router } from "express";
import healthRouter from "./health.js";
import sharesRouter from "./shares.js";

const router = Router();

router.use(healthRouter);
router.use(sharesRouter);

export default router;
