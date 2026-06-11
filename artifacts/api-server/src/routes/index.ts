import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import premiumRouter from "./premium";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", openaiRouter);
router.use("/premium", premiumRouter);
router.use("/admin", adminRouter);

export default router;
