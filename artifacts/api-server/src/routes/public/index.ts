import { Router } from "express";
import { db } from "@workspace/db";
import { ads } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/ads", async (_req, res) => {
  const result = await db
    .select()
    .from(ads)
    .where(eq(ads.isActive, true))
    .orderBy(desc(ads.createdAt));
  res.json(result);
});

export default router;
