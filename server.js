import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "NOVE AI"
  });
});

app.post("/api/chat", async (req, res) => {

  try {

    const { message, previousResponseId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is empty"
      });
    }

    const response = await client.responses.create({

      model: "gpt-5.5",

      instructions: `
You are NOVE AI.

You are a helpful, intelligent AI assistant.
Answer in the same language as the user.
Be friendly and clear.
For programming requests, provide complete working code when appropriate.
Do not claim to have abilities you don't have.
`,

      input: message.trim(),

      ...(previousResponseId
        ? {
            previous_response_id: previousResponseId
          }
        : {})

    });

    res.json({
      answer: response.output_text,
      responseId: response.id
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "AI request failed"
    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `NOVE AI server running on port ${PORT}`
  );

});
