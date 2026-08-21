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
// GEMINI AI CHAT
// =========================

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured"
      });
    }

    const user = getUser(req.ip);

    // Check free limit
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

    const contents = [];

    for (const item of history.slice(-12)) {
      if (!item || !item.content) continue;

      contents.push({
        role:
          item.role === "assistant"
            ? "model"
            : "user",
        parts: [
          {
            text: String(item.content)
          }
        ]
      });
    }

    contents.push({
      role: "user",
      parts: [
        {
          text: message.trim()
        }
      ]
    });

    // =========================
    // GEMINI REQUEST
    // =========================

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        encodeURIComponent(
          process.env.GEMINI_API_KEY
        ),
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are NOVA, a helpful AI assistant. " +
                  "Your name is NOVA. " +
                  "Answer clearly, intelligently and naturally. " +
                  "Be helpful and friendly. " +
                  "Do not say that you are Gemini."
              }
            ]
          },

          contents,

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "GEMINI API ERROR:",
        data
      );

      return res.status(response.status).json({
        error: "Gemini API request failed",
        details:
          data?.error?.message ||
          "Unknown Gemini error"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "";

    if (!reply) {
      return res.status(500).json({
        error:
          "NOVA received an empty AI response"
      });
    }

    // Count successful request
    user.messages++;

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
