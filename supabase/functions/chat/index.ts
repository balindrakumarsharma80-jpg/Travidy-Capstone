import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

async function embedText(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
        outputDimensionality: 1536,
      }),
    }
  );
  const data = await response.json();
  return data.embedding.values;
}

async function generateAnswer(question: string, context: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful Rishikesh travel assistant. Use the following context to answer the user's question. If the context doesn't contain relevant info, say so honestly rather than making things up.

Context:
${context}

User question: ${question}

Answer:`
          }]
        }]
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    return `Gemini generateContent error: ${JSON.stringify(data)}`;
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? `Unexpected response shape: ${JSON.stringify(data)}`;
}

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    const { question } = await req.json();

    if (!question) {
      return Response.json({ error: "Missing 'question' in request body" }, { status: 400 });
    }

    const questionEmbedding = await embedText(question);

    const { data: matches, error } = await ctx.supabaseAdmin.rpc("match_documents", {
      query_embedding: questionEmbedding,
      match_count: 5,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const context = (matches ?? []).map((m: any) => m.content).join("\n\n");
    const answer = await generateAnswer(question, context);

    return Response.json({
      answer,
      sources: matches,
    });
  }),
};