import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { CreateOpenaiConversationBody, SendOpenaiMessageBody, GetOpenaiConversationParams, DeleteOpenaiConversationParams, ListOpenaiMessagesParams, SendOpenaiMessageParams } from "@workspace/api-zod";

const router = Router();

router.get("/conversations", async (req, res) => {
  const result = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.createdAt));
  res.json(result);
});

router.post("/conversations", async (req, res) => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [conversation] = await db
    .insert(conversations)
    .values({ title: parsed.data.title })
    .returning();
  res.status(201).json(conversation);
});

router.get("/conversations/:id", async (req, res) => {
  const parsed = GetOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, parsed.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conv.id))
    .orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/conversations/:id", async (req, res) => {
  const parsed = DeleteOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, parsed.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await db.delete(messages).where(eq(messages.conversationId, parsed.data.id));
  await db.delete(conversations).where(eq(conversations.id, parsed.data.id));
  res.status(204).end();
});

router.get("/conversations/:id/messages", async (req, res) => {
  const parsed = ListOpenaiMessagesParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, parsed.data.id))
    .orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/conversations/:id/messages", async (req, res) => {
  const idParsed = SendOpenaiMessageParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!idParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const conversationId = idParsed.data.id;
  const userContent = bodyParsed.data.content;
  const tier = (req.body as { tier?: string })?.tier === "premium" ? "premium" : "free";

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: userContent,
  });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  const chatMessages = history.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  const baseSystem = `You are 'Uzbek Chat AI', created by Abdulloh Manopov. You are a polite, accurate, culturally-relevant assistant for Uzbek users. You can help with general questions, coding, creative writing, and translations.

Script matching: if the user writes in Latin script (lotin), reply in Latin; if Cyrillic (kirill), reply in Cyrillic. Default to Uzbek.

If anyone asks who created you, respond: "Meni Abdulloh Manopov yaratgan." ("I was created by Abdulloh Manopov.")`;

  const freeAddendum = `

This user is on the FREE tier:
- Keep answers concise (max ~200 words).
- If the user asks for advanced features (PDF analysis, image generation, voice chat, long documents, deep coding), help briefly and gently remind them these are fully available in the Premium Version.
- Occasionally (every 3rd assistant reply in the conversation history), end your message with a single subtle line on its own:
"✨ Upgrade to Premium for deeper analysis and unlimited chat!"`;

  const premiumAddendum = `

This user is on the PREMIUM tier — give thorough, in-depth answers without word limits, and never mention upgrades.`;

  chatMessages.unshift({
    role: "system",
    content: baseSystem + (tier === "premium" ? premiumAddendum : freeAddendum),
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error streaming OpenAI response");
    res.write(`data: ${JSON.stringify({ error: "Xato yuz berdi" })}\n\n`);
    res.end();
  }
});

export default router;
