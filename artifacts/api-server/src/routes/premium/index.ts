import { Router } from "express";
import { db, premiumCodes } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function seedCodesIfEmpty(req: { log: { info: (...args: unknown[]) => void } } | null) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(premiumCodes);
  if (count > 0) return;

  const codes = new Set<string>();
  while (codes.size < 20) codes.add(generateCode());
  await db
    .insert(premiumCodes)
    .values([...codes].map((code) => ({ code })))
    .onConflictDoNothing();
  const list = [...codes].join(", ");
  if (req) req.log.info({ codes: [...codes] }, "Seeded premium codes");
  console.log("\n========== PREMIUM ACTIVATION CODES (initial seed) ==========");
  console.log(list);
  console.log("=============================================================\n");
}

// Self-seed on module load
seedCodesIfEmpty(null).catch((err) =>
  console.error("Failed to seed premium codes:", err),
);

/**
 * POST /api/premium/activate
 * body: { code: string }
 * Returns { ok: true } and DELETES the code if it matches.
 */
router.post("/activate", async (req, res) => {
  const code = String((req.body as { code?: string })?.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ ok: false, error: "Kod 6 ta raqamdan iborat bo'lishi kerak." });
    return;
  }

  const result = await db
    .delete(premiumCodes)
    .where(eq(premiumCodes.code, code))
    .returning({ code: premiumCodes.code });

  if (result.length === 0) {
    res.status(404).json({ ok: false, error: "Kod noto'g'ri yoki allaqachon ishlatilgan." });
    return;
  }

  res.json({ ok: true });
});

/**
 * POST /api/premium/admin/codes
 * Header: x-admin-secret: <ADMIN_SECRET>
 * Body: { count?: number } (default 5)
 * Returns: { codes: string[] }
 */
router.post("/admin/codes", async (req, res) => {
  if (!ADMIN_SECRET) {
    res
      .status(503)
      .json({ error: "ADMIN_SECRET env var is not set on the server." });
    return;
  }
  if (req.header("x-admin-secret") !== ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const requested = Math.max(1, Math.min(100, Number((req.body as { count?: number })?.count ?? 5)));
  const codes = new Set<string>();
  let attempts = 0;
  while (codes.size < requested && attempts < requested * 5) {
    codes.add(generateCode());
    attempts++;
  }

  await db
    .insert(premiumCodes)
    .values([...codes].map((code) => ({ code })))
    .onConflictDoNothing();

  res.json({ codes: [...codes] });
});

/**
 * GET /api/premium/admin/codes — list valid (un-used) codes (admin only)
 */
router.get("/admin/codes", async (req, res) => {
  if (!ADMIN_SECRET || req.header("x-admin-secret") !== ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db.select().from(premiumCodes);
  res.json({ codes: rows.map((r) => r.code), count: rows.length });
});

export default router;
