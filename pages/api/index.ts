// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = string;

import QueryProcessor from "../../utils/QueryProcessor";

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-5.5";
const OPENROUTER_TIMEOUT_MS = 5000;

const SYSTEM_PROMPT =
  "You answer quiz questions sent to a web server. Respond with ONLY the correct answer " +
  "and nothing else: no explanation, no full sentence, no quotes, no trailing punctuation. " +
  "Give numbers as plain digits. If several answers are correct, separate them with \", \". " +
  "When choosing from a list, copy the matching item(s) exactly as written.";

// Fallback for questions QueryProcessor doesn't recognise. Returns "" on any failure.
async function askOpenRouter(query: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 100,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error("OpenRouter error", response.status, await response.text());
      return "";
    }
    const data = await response.json();
    return (data.choices?.[0]?.message?.content ?? "").trim();
  } catch (error) {
    console.error("OpenRouter request failed", error);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log(req.url);

  const query = req.query.q as string;
  let response = QueryProcessor(query);
  if (response === "") {
    response = await askOpenRouter(query);
  }

  res.status(200).send(response);
}
