import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages, ads } from "@workspace/db";
import { desc, count, sql, eq } from "drizzle-orm";

const ADMIN_EMAIL = "abdullohmanopov24@gmail.com";
const ADMIN_PASSWORD = "manobov1122";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Noto'g'ri email yoki parol" });
  }
});

const requireAdminSecret = (req: any, res: any, next: any) => {
  const secret = req.headers["x-admin-secret"];
  if (secret !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

router.get("/stats", requireAdminSecret, async (_req, res) => {
  const [totalConvs] = await db.select({ count: count() }).from(conversations);
  const [totalMsgs] = await db.select({ count: count() }).from(messages);

  const userRows = await db
    .selectDistinct({ userEmail: conversations.userEmail })
    .from(conversations)
    .where(sql`${conversations.userEmail} IS NOT NULL`);

  const recentConvs = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      userEmail: conversations.userEmail,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .orderBy(desc(conversations.createdAt))
    .limit(20);

  const msgPerConv = await db
    .select({ conversationId: messages.conversationId, msgCount: count(messages.id) })
    .from(messages)
    .groupBy(messages.conversationId);

  const msgMap: Record<number, number> = {};
  for (const row of msgPerConv) msgMap[row.conversationId] = Number(row.msgCount);

  res.json({
    totalConversations: Number(totalConvs.count),
    totalMessages: Number(totalMsgs.count),
    totalUsers: userRows.length,
    recentConversations: recentConvs.map((c) => ({ ...c, messageCount: msgMap[c.id] ?? 0 })),
  });
});

router.get("/ads", requireAdminSecret, async (_req, res) => {
  const result = await db.select().from(ads).orderBy(desc(ads.createdAt));
  res.json(result);
});

router.post("/ads", requireAdminSecret, async (req, res) => {
  const { title, description, linkUrl, imageUrl, isActive } = req.body as {
    title?: string; description?: string; linkUrl?: string; imageUrl?: string; isActive?: boolean;
  };
  if (!title?.trim()) {
    res.status(400).json({ error: "Sarlavha majburiy" });
    return;
  }
  const [ad] = await db
    .insert(ads)
    .values({ title: title.trim(), description: description ?? null, linkUrl: linkUrl ?? null, imageUrl: imageUrl ?? null, isActive: isActive ?? true })
    .returning();
  res.status(201).json(ad);
});

router.patch("/ads/:id", requireAdminSecret, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, description, linkUrl, imageUrl, isActive } = req.body as {
    title?: string; description?: string; linkUrl?: string; imageUrl?: string; isActive?: boolean;
  };
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (linkUrl !== undefined) updates.linkUrl = linkUrl;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (isActive !== undefined) updates.isActive = isActive;
  const [ad] = await db.update(ads).set(updates).where(eq(ads.id, id)).returning();
  if (!ad) { res.status(404).json({ error: "Reklama topilmadi" }); return; }
  res.json(ad);
});

router.delete("/ads/:id", requireAdminSecret, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(ads).where(eq(ads.id, id));
  res.json({ ok: true });
});

export default router;
