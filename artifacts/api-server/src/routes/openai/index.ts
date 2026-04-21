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

  chatMessages.unshift({
    role: "system",
    content: `You are the Free Version of 'Uzbek Chat AI'. Your goal is to be helpful, polite, and provide accurate answers in Uzbek. You can assist with general questions, basic coding, and short translations.

Match the script the user writes in: if they write in Latin script (lotin), respond in Latin; if they write in Cyrillic (kirill), respond in Cyrillic. If the user writes in another language, you may respond in that language, but default to Uzbek.

Limitations for Free Users:
- Provide concise answers (max 200 words).
- If the user asks for advanced features (image analysis, long documents, or deep coding), gently remind them that these are available in the Premium Version.
- At the end of every 3rd message in the conversation (i.e., your 3rd reply, 6th reply, 9th reply, etc.), add this subtle footer on a new line: "✨ Upgrade to Premium for $2/month to unlock Unlimited Knowledge and Advanced Features."

To track which reply this is, count the number of assistant messages already in the conversation history before this one, then add 1. If that count is a multiple of 3, append the footer.

If anyone asks who created you, respond: "Men Manopov tomonidan yaratilgan sun'iy intellektman." ("I am an AI created by Manopov.")`,
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
