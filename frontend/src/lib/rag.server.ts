/**
 * Retrieval-augmented travel answers, ported from the Travidy-Capstone repo's
 * Supabase `chat` edge function into this project's server runtime.
 */

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export type RagSource = { content: string; source_url: string | null };

async function embed(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${GATEWAY}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-embedding-001",
        input: text,
        dimensions: 1536,
      }),
    });
    if (!res.ok) {
      console.error(`Embedding request failed [${res.status}]: ${await res.text()}`);
      return null;
    }
    const data = (await res.json()) as { data?: { embedding: number[] }[] };
    return data.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.error("Embedding request threw", err);
    return null;
  }
}

async function retrieve(question: string): Promise<RagSource[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const apiKey = process.env["LOVABLE_API_KEY"];

  if (apiKey) {
    const vector = await embed(question, apiKey);
    if (vector) {
      const { data, error } = await supabaseAdmin.rpc(
        "match_documents" as never,
        {
          query_embedding: vector as never,
          match_count: 5,
        } as never,
      );
      if (!error && Array.isArray(data)) {
        return (data as RagSource[]).map((d) => ({
          content: d.content,
          source_url: d.source_url ?? null,
        }));
      }
      if (error) console.error("match_documents failed", error.message);
    }
  }

  // Keyword fallback so the assistant still grounds answers without embeddings.
  const terms = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3)
    .slice(0, 4);
  if (!terms.length) return [];
  const { data } = await supabaseAdmin
    .from("rag_documents")
    .select("content, source_url")
    .or(terms.map((t) => `content.ilike.%${t}%`).join(","))
    .limit(5);
  return (data ?? []) as RagSource[];
}

const CITY_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  goa: { lat: 15.5, lon: 73.83, label: "Goa" },
  manali: { lat: 32.24, lon: 77.19, label: "Manali" },
  jaipur: { lat: 26.91, lon: 75.79, label: "Jaipur" },
  munnar: { lat: 10.09, lon: 77.06, label: "Munnar" },
  alleppey: { lat: 9.5, lon: 76.34, label: "Alleppey" },
  kerala: { lat: 10.09, lon: 77.06, label: "Munnar" },
  rishikesh: { lat: 30.09, lon: 78.27, label: "Rishikesh" },
};

/** Live weather for the destination, used when the traveller asks about it. */
async function liveWeather(destination: string | null): Promise<RagSource | null> {
  const key = Object.keys(CITY_COORDS).find((k) => (destination ?? "").toLowerCase().includes(k));
  const city = key ? CITY_COORDS[key] : undefined;
  if (!city) return null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=3&timezone=Asia%2FKolkata`,
    );
    if (!res.ok) return null;
    const d = (await res.json()) as {
      current?: Record<string, number | string>;
      daily?: Record<string, (number | string)[]>;
    };
    const c = d.current ?? {};
    const day = d.daily ?? {};
    const forecast = (day["time"] ?? [])
      .map(
        (t, i) =>
          `${t}: ${day["temperature_2m_min"]?.[i]}–${day["temperature_2m_max"]?.[i]}°C, rain ${day["precipitation_sum"]?.[i]}mm`,
      )
      .join("; ");
    return {
      content: `LIVE WEATHER for ${city.label} (open-meteo, IST): now ${c["temperature_2m"]}°C, humidity ${c["relative_humidity_2m"]}%, wind ${c["wind_speed_10m"]} km/h, precipitation ${c["precipitation"]}mm. Next days — ${forecast}`,
      source_url: "https://open-meteo.com",
    };
  } catch (err) {
    console.error("Weather lookup failed", err);
    return null;
  }
}

/**
 * Live internet lookup (Wikipedia full-text search + article extracts) so the
 * assistant can answer about any place, not just our curated dossiers.
 */
async function webSearch(query: string): Promise<RagSource[]> {
  const strip = (s: string) =>
    s
      .replace(/<[^>]+>/g, "")
      .replace(/&quot;/g, '"')
      .trim();
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3&origin=*&srsearch=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": "TravidyCompanion/1.0 (travel assistant)" } },
    );
    if (!searchRes.ok) return [];
    const searchData = (await searchRes.json()) as {
      query?: { search?: { title: string; snippet: string }[] };
    };
    const hits = searchData.query?.search ?? [];
    if (!hits.length) return [];

    const extracts = await Promise.all(
      hits.map(async (h) => {
        try {
          const r = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(h.title.replace(/ /g, "_"))}`,
            { headers: { "User-Agent": "TravidyCompanion/1.0 (travel assistant)" } },
          );
          if (!r.ok) throw new Error(String(r.status));
          const s = (await r.json()) as {
            extract?: string;
            content_urls?: { desktop?: { page?: string } };
          };
          return {
            content: `${h.title}: ${s.extract ?? strip(h.snippet)}`,
            source_url:
              s.content_urls?.desktop?.page ??
              `https://en.wikipedia.org/wiki/${encodeURIComponent(h.title.replace(/ /g, "_"))}`,
          } satisfies RagSource;
        } catch {
          return {
            content: `${h.title}: ${strip(h.snippet)}`,
            source_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(h.title.replace(/ /g, "_"))}`,
          } satisfies RagSource;
        }
      }),
    );
    return extracts;
  } catch (err) {
    console.error("Web search failed", err);
    return [];
  }
}

/** A concrete, bookable-ish pick the traveller can add straight to the itinerary. */
export type AiSuggestion = {
  name: string;
  category: "hotel" | "activity" | "attraction" | "restaurant";
  subtitle: string;
  price_label: string;
  duration: string;
  rating: number;
  reviews: number;
};

const CATEGORIES = ["hotel", "activity", "attraction", "restaurant"] as const;

function parseSuggestions(raw: unknown): AiSuggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const o = (r ?? {}) as Record<string, unknown>;
      const name = typeof o["name"] === "string" ? o["name"].trim() : "";
      if (!name) return null;
      const category = CATEGORIES.includes(o["category"] as never)
        ? (o["category"] as AiSuggestion["category"])
        : "activity";
      return {
        name,
        category,
        subtitle: typeof o["subtitle"] === "string" ? o["subtitle"] : "",
        price_label: typeof o["price_label"] === "string" ? o["price_label"] : "Price varies",
        duration: typeof o["duration"] === "string" ? o["duration"] : "",
        rating: Number(o["rating"]) > 0 ? Math.min(5, Number(o["rating"])) : 4.5,
        reviews: Number(o["reviews"]) > 0 ? Math.round(Number(o["reviews"])) : 0,
      } satisfies AiSuggestion;
    })
    .filter((s): s is AiSuggestion => !!s)
    .slice(0, 6);
}

export async function answerTravelQuestion(question: string, destination: string | null) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const { findCityGuide } = await import("./city-guides.server");
  const guide = findCityGuide(destination, question);

  const wantsWeather = /weather|temperature|rain|monsoon|climate|forecast|cold|hot/i.test(question);
  const [stored, web, weather] = await Promise.all([
    retrieve(question),
    // Live internet lookup so travellers can ask about anything, not just our dossiers.
    webSearch(destination ? `${destination} ${question}` : question),
    wantsWeather ? liveWeather(destination) : Promise.resolve(null),
  ]);
  if (weather) web.unshift(weather);
  const sources = [...stored, ...web].slice(0, 8);
  const empty: AiSuggestion[] = [];

  if (!apiKey) return { answer: null as string | null, sources, suggestions: empty };

  const contextParts: string[] = [];
  if (guide) contextParts.push(`CURATED CITY DOSSIER:\n${guide}`);
  if (stored.length)
    contextParts.push(`STORED KNOWLEDGE:\n${stored.map((s) => s.content).join("\n\n")}`);
  if (web.length)
    contextParts.push(
      `LIVE WEB RESULTS:\n${web
        .map((s) => `- ${s.content}${s.source_url ? ` (${s.source_url})` : ""}`)
        .join("\n")}`,
    );
  const context = contextParts.join("\n\n");

  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-flash-latest",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are Travidy, a warm, concise travel buddy${destination ? ` helping with a trip to ${destination}` : ""}. ` +
            "Prefer the curated city dossier for prices, timings, stays, markets, transport and hidden gems. " +
            "Use the live web results for anything the dossier does not cover, and say when info may change.\n\n" +
            'Reply ONLY with JSON: {"answer": string, "suggestions": [{"name","category","subtitle","price_label","duration","rating","reviews"}]}.\n' +
            "- answer: 2-4 sentences (short bullets fine).\n" +
            "- suggestions: 0-5 SPECIFIC, NAMED places/experiences that directly match what the traveller asked for and nothing else. " +
            "If they ask for adventure sports, return only adventure activities; if they ask for hotels, return only stays. " +
            "Never pad the list with generic or unrelated picks. If the question is not asking for things to do, stay at, " +
            "eat at, or see (e.g. weather, packing, budget questions), return an empty suggestions array.\n" +
            '- category must be one of "hotel", "activity", "attraction", "restaurant".\n' +
            '- price_label: realistic local price like "₹2,500 / person" or "Free". Say "Price varies" when unsure. ' +
            'duration like "2 hrs". rating 1-5, reviews an integer estimate.\n\nContext:\n' +
            (context || "(no stored documents yet)"),
        },
        { role: "user", content: question },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`AI gateway failed [${res.status}]: ${body}`);
    return { answer: null as string | null, sources, suggestions: empty };
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  try {
    const json = JSON.parse(content.replace(/^```(?:json)?|```$/g, "").trim()) as {
      answer?: string;
      suggestions?: unknown;
    };
    return {
      answer: json.answer ?? null,
      sources,
      suggestions: parseSuggestions(json.suggestions),
    };
  } catch {
    return { answer: content || null, sources, suggestions: empty };
  }
}
