import { Router } from "express";
import { db, premiumCodes } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

const PERMANENT_CODES = new Set(["525252", "252525"]);

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function seedCodesIfEmpty(req: { log: { info: (...args: unknown[]) => void } } | null) {
  // Always ensure permanent codes exist
  await db
    .insert(premiumCodes)
    .values([...PERMANENT_CODES].map((code) => ({ code })))
    .onConflictDoNothing();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(premiumCodes);

  if (count > 2) return;

  const codes = new Set<string>();
  while (codes.size < 20) {
    const c = generateCode();
    if (!PERMANENT_CODES.has(c)) codes.add(c);
  }
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

seedCodesIfEmpty(null).catch((err) =>
  console.error("Failed to seed premium codes:", err),
);

/**
 * POST /api/premium/activate
 * body: { code: string }
 * Permanent codes (525252, 252525) are validated but never deleted.
 * All other codes are single-use and deleted on activation.
 */
router.post("/activate", async (req, res) => {
  const code = String((req.body as { code?: string })?.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ ok: false, error: "Kod 6 ta raqamdan iborat bo'lishi kerak." });
    return;
  }

  // Permanent codes: just verify existence, never delete
  if (PERMANENT_CODES.has(code)) {
    const rows = await db
      .select()
      .from(premiumCodes)
      .where(eq(premiumCodes.code, code));
    if (rows.length > 0) {
      res.json({ ok: true });
      return;
    }
    res.status(404).json({ ok: false, error: "Kod noto'g'ri yoki allaqachon ishlatilgan." });
    return;
  }

  // Regular single-use codes: delete on activation
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
 */
router.post("/admin/codes", async (req, res) => {
  if (!ADMIN_SECRET) {
    res.status(503).json({ error: "ADMIN_SECRET env var is not set on the server." });
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
    const c = generateCode();
    if (!PERMANENT_CODES.has(c)) codes.add(c);
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
