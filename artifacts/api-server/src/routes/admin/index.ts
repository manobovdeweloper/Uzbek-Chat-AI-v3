import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { desc, count, sql } from "drizzle-orm";

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
    .select({
      conversationId: messages.conversationId,
      msgCount: count(messages.id),
    })
    .from(messages)
    .groupBy(messages.conversationId);

  const msgMap: Record<number, number> = {};
  for (const row of msgPerConv) {
    msgMap[row.conversationId] = Number(row.msgCount);
  }

  res.json({
    totalConversations: Number(totalConvs.count),
    totalMessages: Number(totalMsgs.count),
    totalUsers: userRows.length,
    recentConversations: recentConvs.map((c) => ({
      ...c,
      messageCount: msgMap[c.id] ?? 0,
    })),
  });
});

export default router;
