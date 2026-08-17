import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY"); // optional — search_web degrades gracefully if unset

const GEMINI_EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";
const GEMINI_GENERATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// ---------------------------------------------------------------------------
// Tool definitions (Gemini function-calling schema)
// ---------------------------------------------------------------------------

const TOOL_DECLARATIONS = [
  {
    name: "search_knowledge_base",
    description:
      "Search Travidy's curated database of hotels, POIs, activities, and transport for the current destination. Use for general destination facts, descriptions, and recommendations.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for, e.g. 'budget hotels near the station'" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_web",
    description:
      "Search the live web for current information — today's opening hours, recent events, weather-dependent plans, or anything time-sensitive that curated data won't have.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The live/current-info question to search for" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_hotels",
    description:
      "Look up hotels for the current destination filtered by exact price or rating. Use when the user gives a specific budget or rating constraint.",
    parameters: {
      type: "object",
      properties: {
        max_price: { type: "number", description: "Maximum nightly price in INR" },
        min_rating: { type: "number", description: "Minimum star rating, e.g. 3" },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------

async function embedText(text: string): Promise<number[]> {
  const response = await fetch(`${GEMINI_EMBED_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      outputDimensionality: 1536,
    }),
  });
  const data = await response.json();
  return data.embedding.values;
}

async function callGemini(contents: any[], systemInstruction: string) {
  const response = await fetch(`${GEMINI_GENERATE_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Gemini error: ${JSON.stringify(data)}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

async function hashQuery(query: string): Promise<string> {
  const encoded = new TextEncoder().encode(query.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function runTool(
  name: string,
  args: any,
  ctx: any,
  destinationId: string | null
): Promise<{ result: any; sourceLabel: string; sourceType: string }> {
  if (name === "search_knowledge_base") {
    const embedding = await embedText(args.query);
    const { data, error } = await ctx.supabaseAdmin.rpc("match_rag_documents", {
      query_embedding: embedding,
      match_destination_id: destinationId,
      match_count: 5,
    });
    if (error) return { result: `Error: ${error.message}`, sourceLabel: "knowledge base (error)", sourceType: "vector_search" };
    return {
      result: (data ?? []).map((d: any) => d.content).join("\n\n") || "No matching results.",
      sourceLabel: `curated destination data (${(data ?? []).length} matches)`,
      sourceType: "vector_search",
    };
  }

  if (name === "search_web") {
    const queryHash = await hashQuery(args.query);
    const { data: cached } = await ctx.supabaseAdmin
      .from("web_search_cache")
      .select("results, expires_at")
      .eq("query_hash", queryHash)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return { result: cached.results, sourceLabel: "live web (cached)", sourceType: "web_search" };
    }

    if (!TAVILY_API_KEY) {
      return {
        result: "Live web search is not configured.",
        sourceLabel: "live web (unavailable)",
        sourceType: "web_search",
      };
    }

    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: TAVILY_API_KEY, query: args.query, max_results: 5 }),
    });
    const tavilyData = await tavilyRes.json();
    const summarized = (tavilyData.results ?? [])
      .map((r: any) => `${r.title}: ${r.content}`)
      .join("\n\n");

    await ctx.supabaseAdmin.from("web_search_cache").upsert({
      query_hash: queryHash,
      query_text: args.query,
      results: summarized,
      source: "tavily",
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6h TTL
    });

    return { result: summarized || "No results found.", sourceLabel: "live web search", sourceType: "web_search" };
  }

  if (name === "search_hotels") {
    let query = ctx.supabaseAdmin.from("hotels").select("*").eq("destination_id", destinationId).limit(10);
    if (args.max_price) query = query.lte("price_max", args.max_price);
    if (args.min_rating) query = query.gte("star_rating", args.min_rating);
    const { data, error } = await query;
    if (error) return { result: `Error: ${error.message}`, sourceLabel: "hotel database (error)", sourceType: "structured_data" };
    return {
      result: JSON.stringify(data ?? []),
      sourceLabel: `hotel database (${(data ?? []).length} matches)`,
      sourceType: "structured_data",
    };
  }

  return { result: "Unknown tool.", sourceLabel: "unknown", sourceType: "structured_data" };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, content-type",
        },
      });
    }

    const { question, trip_id, user_id } = await req.json();

    if (!question || !trip_id) {
      return Response.json({ error: "Missing 'question' or 'trip_id' in request body" }, { status: 400 });
    }

    try {
    return await handleChat(question, trip_id, user_id, ctx);
    } catch (err) {
      console.error("chat function error:", err); // still logged server-side for you to see in the dashboard
      return Response.json(
        { error: "Something went wrong generating a response. Please try again." },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
  }),
};

async function handleChat(question: string, trip_id: string, user_id: string, ctx: any) {
    // Resolve destination context from the trip — this is what makes the agent
    // work for any city without code changes, not just Rishikesh.
    const { data: trip, error: tripError } = await ctx.supabaseAdmin
      .from("trips")
      .select("destination_id")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }

    const destinationId = trip.destination_id;
    const { data: destination } = await ctx.supabaseAdmin
      .from("destinations")
      .select("name, state")
      .eq("id", destinationId)
      .single();

    const destinationName = destination ? `${destination.name}, ${destination.state}` : "the traveller's destination";

    // Load recent conversation for context
    const { data: history } = await ctx.supabaseAdmin
      .from("chat_history")
      .select("role, message")
      .eq("trip_id", trip_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const conversationContents = (history ?? [])
      .reverse()
      .map((h: any) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.message }],
      }));

    const systemInstruction = `You are Travidy, a travel companion for a trip to ${destinationName}. Use the available tools to ground your answers: search_knowledge_base for curated destination facts, search_web for anything current or time-sensitive, search_hotels for precise price/rating filters. Do not answer from general knowledge if a tool would give a more accurate, current answer. Keep answers concise and practical.`;

    let contents = [...conversationContents, { role: "user", parts: [{ text: question }] }];

    const toolsUsed: { tool: string; args: any }[] = [];
    const sources: { type: string; label: string }[] = [];

    let finalAnswer = "";
    const MAX_TURNS = 4;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const geminiResponse = await callGemini(contents, systemInstruction);
      const candidate = geminiResponse.candidates?.[0];
      const modelContent = candidate?.content;
      const parts = modelContent?.parts ?? [];
      const functionCallPart = parts.find((p: any) => p.functionCall);

      if (!functionCallPart) {
        finalAnswer = parts.map((p: any) => p.text).filter(Boolean).join("\n") || "I couldn't generate an answer — please try rephrasing.";
        break;
      }

      const { name, args } = functionCallPart.functionCall;
      toolsUsed.push({ tool: name, args });

      const { result, sourceLabel, sourceType } = await runTool(name, args, ctx, destinationId);
      sources.push({ type: sourceType, label: sourceLabel });

      // Pass back the model's FULL content object (not a hand-built one) so any
      // thoughtSignature Gemini attached is preserved — required for multi-turn
      // function calling on Gemini 3 models. The function *response* itself goes
      // back with role "user" — Gemini's current API rejects role "function".
      contents = [
        ...contents,
        modelContent,
        { role: "user", parts: [{ functionResponse: { name, response: { result } } }] },
      ];

      if (turn === MAX_TURNS - 1) {
        finalAnswer = "I gathered some information but couldn't finish reasoning about it — please try a more specific question.";
      }
    }

    // Persist conversation
    await ctx.supabaseAdmin.from("chat_history").insert([
      { user_id, trip_id, role: "user", message: question },
      { user_id, trip_id, role: "assistant", message: finalAnswer, sources },
    ]);

    // Audit log
    await ctx.supabaseAdmin.from("agent_runs").insert({
      user_id,
      trip_id,
      agent_type: "chat",
      input: question,
      output: finalAnswer,
      tools_used: toolsUsed,
    });

    return Response.json(
      { answer: finalAnswer, sources },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
}