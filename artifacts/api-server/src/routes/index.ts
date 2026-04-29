import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import premiumRouter from "./premium";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", openaiRouter);
router.use("/premium", premiumRouter);

export default router;
