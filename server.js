import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 10000;
// =========================
// SETTINGS
// =========================
const FREE_MESSAGES = 50;
const RESET_TIME = 24 * 60 * 60 * 1000;
// =========================
// MIDDLEWARE
// =========================
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
// =========================
// FRONTEND
// =========================
app.use(express.static(__dirname));
// =========================
// FREE MESSAGE LIMIT
// =========================
const users = new Map();
function getUser(ip) {
  const now = Date.now();
  let user = users.get(ip);
  if (!user) {
    user = {
      messages: 0,
      resetAt: now + RESET_TIME
    };
    users.set(ip, user);
  }
  if (now >= user.resetAt) {
    user.messages = 0;
    user.resetAt = now + RESET_TIME;
  }
  return user;
}
// =========================
// STATUS
// =========================
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    name: "NOVA AI",
    version: "2.0",
    provider: "Mistral",
    freeMessages: FREE_MESSAGES
  });
});
// =========================
// USAGE
// =========================
app.get("/api/usage", (req, res) => {
  const user = getUser(req.ip);
  res.json({
    used: user.messages,
    limit: FREE_MESSAGES,
    remaining: Math.max(
      0,
      FREE_MESSAGES - user.messages
    ),
    resetAt: user.resetAt
  });
});
// =========================
// MISTRAL AI CHAT
// =========================
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }
    if (!process.env.MISTRAL_API_KEY) {
      return res.status(500).json({
        error: "MISTRAL_API_KEY is not configured"
      });
    }
    const user = getUser(req.ip);
    // =========================
    // CHECK FREE LIMIT
    // =========================
    if (user.messages >= FREE_MESSAGES) {
      const remaining = user.resetAt - Date.now();
      const hours = Math.floor(
        remaining / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (remaining % (1000 * 60 * 60)) /
          (1000 * 60)
      );
      return res.status(429).json({
        error: "FREE_LIMIT_REACHED",
        message:
          `Free limit reached. Try again in ${hours}h ${minutes}m.`,
        used: user.messages,
        limit: FREE_MESSAGES,
        remaining: 0,
        resetAt: user.resetAt
      });
    }
    // =========================
    // CONVERSATION HISTORY
    // =========================
    const messages = [
      {
        role: "system",
        content:
          "You are NOVA, a helpful AI assistant. " +
          "Your name is NOVA. " +
          "Answer clearly, intelligently and naturally. " +
          "Be helpful and friendly. " +
          "Do not say that you are Mistral."
      }
    ];
    for (const item of history.slice(-12)) {
      if (!item || !item.content) continue;
      messages.push({
        role:
          item.role === "assistant"
            ? "assistant"
            : "user",
        content: String(item.content)
      });
    }
    messages.push({
      role: "user",
      content: message.trim()
    });
    // =========================
    // MISTRAL REQUEST
    // =========================
    const response = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages,
          temperature: 0.7,
          max_tokens: 2048
        })
      }
    );
    const data = await response.json();
    // =========================
    // API ERROR
    // =========================
    if (!response.ok) {
      console.error(
        "MISTRAL API ERROR:",
        data
      );
      return res.status(response.status).json({
        error: "Mistral API request failed",
        details:
          data?.message ||
          data?.error?.message ||
          "Unknown Mistral error"
      });
    }
    // =========================
    // GET AI RESPONSE
    // =========================
    const reply =
      data?.choices?.[0]?.message?.content || "";
    if (!reply) {
      return res.status(500).json({
        error:
          "NOVA received an empty AI response"
      });
    }
    // Count only successful AI requests
    user.messages++;
    // =========================
    // SEND RESPONSE
    // =========================
    res.json({
      reply,
      usage: {
        used: user.messages,
        limit: FREE_MESSAGES,
        remaining:
          FREE_MESSAGES - user.messages,
        resetAt: user.resetAt
      }
    });
  } catch (error) {
    console.error(
      "NOVA SERVER ERROR:",
      error
    );
    res.status(500).json({
      error: "NOVA AI request failed"
    });
  }
});
// =========================
// FRONTEND FALLBACK
// =========================
// =========================
// START SERVER
// =========================
app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `NOVA AI server running on port ${PORT}`
    );
  }
);
