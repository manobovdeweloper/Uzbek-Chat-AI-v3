import { Router } from "express";
import { db } from "@workspace/db";
import { ads, announcements } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { recordHeartbeat } from "../admin/index.js";

const router = Router();

router.get("/ads", async (_req, res) => {
  const result = await db
    .select()
    .from(ads)
    .where(eq(ads.isActive, true))
    .orderBy(desc(ads.createdAt));
  res.json(result);
});

router.get("/announcements", async (_req, res) => {
  const result = await db
    .select()
    .from(announcements)
    .where(eq(announcements.isActive, true))
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  res.json(result);
});

router.post("/heartbeat", (req, res) => {
  const userId = (req.body as { userId?: string }).userId ?? `anon_${req.ip}`;
  recordHeartbeat(userId);
  res.json({ ok: true });
});

export default router;
