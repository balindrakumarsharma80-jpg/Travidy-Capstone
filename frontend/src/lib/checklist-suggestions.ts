import type { ItineraryItem } from "@/lib/travidy";

/** Rules that turn a planned activity into things you should actually pack/do. */
const RULES: { match: RegExp; tasks: string[] }[] = [
  {
    match: /raft|kayak|surf|water|beach|lagoon|swim/i,
    tasks: ["Pack quick-dry clothes", "Waterproof phone pouch", "Reef-safe sunscreen"],
  },
  {
    match: /bungee|zip|swing|paraglid|skydiv|adventure/i,
    tasks: [
      "Carry a photo ID for the safety waiver",
      "Wear closed shoes",
      "Avoid a heavy meal before the jump",
    ],
  },
  {
    match: /temple|ashram|church|mosque|monaster|spiritual|aarti/i,
    tasks: ["Pack modest clothing", "Carry socks — shoes come off", "Small cash for offerings"],
  },
  {
    match: /trek|hike|waterfall|valley|mountain|peak|trail/i,
    tasks: ["Break in your trekking shoes", "Refillable water bottle", "Light rain jacket"],
  },
  {
    match: /yoga|meditat|retreat|spa/i,
    tasks: ["Pack a yoga mat or towel", "Comfortable stretch wear"],
  },
  {
    match: /night|club|party|bar|market/i,
    tasks: ["Keep cash + a backup card", "Save a taxi app for the ride back"],
  },
  {
    match: /safari|wildlife|park|sanctuary/i,
    tasks: ["Carry binoculars", "Neutral coloured clothing", "Insect repellent"],
  },
  {
    match: /houseboat|cruise|backwater|ferry/i,
    tasks: ["Motion-sickness tablets", "Light shawl for the evening breeze"],
  },
];

const CATEGORY_TASKS: Record<string, string[]> = {
  hotel: ["Save the hotel booking confirmation offline", "Note the check-in time"],
  restaurant: ["Reserve a table for peak hours"],
  attraction: ["Check entry timings & ticket prices"],
  activity: ["Book the activity slot in advance"],
};

const BASE_TASKS = [
  "Carry a government photo ID",
  "Download offline maps",
  "Power bank & charging cable",
];

/** Checklist tasks suggested from what is actually planned in the itinerary. */
export function suggestChecklist(items: ItineraryItem[], existing: string[]): string[] {
  const have = new Set(existing.map((l) => l.trim().toLowerCase()));
  const out: string[] = [];
  const push = (t: string) => {
    if (!have.has(t.toLowerCase()) && !out.includes(t)) out.push(t);
  };

  if (items.length === 0) return [];

  for (const item of items) {
    const text = `${item.title} ${item.place ?? ""} ${item.category ?? ""}`;
    for (const rule of RULES) if (rule.match.test(text)) rule.tasks.forEach(push);
    (CATEGORY_TASKS[item.category ?? ""] ?? []).forEach(push);
  }
  BASE_TASKS.forEach(push);
  return out.slice(0, 8);
}
