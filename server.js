import express from "express";
import cors from "cors";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Отдаём весь сайт из корня проекта
app.use(express.static(__dirname));

// API status
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    name: "NOVA AI",
    version: "2.0"
  });
});

// OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured"
      });
    }

    const input = [
      {
        role: "system",
        content:
          "You are NOVA, a helpful AI assistant. Be clear, useful, friendly and concise."
      },
      ...history.slice(-12),
      {
        role: "user",
        content: message.trim()
      }
    ];

    const response = await client.responses.create({
      model: "gpt-5",
      input
    });

    res.json({
      reply: response.output_text || "NOVA couldn't generate a response."
    });

  } catch (error) {
    console.error("NOVA AI ERROR:", error);

    res.status(500).json({
      error: "NOVA AI request failed"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NOVA AI server running on port ${PORT}`);
});
