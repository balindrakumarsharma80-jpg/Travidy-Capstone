import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Search, SearchX, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { PhoneShell } from "@/components/travidy/shell";
import { AppHeader } from "@/components/travidy/app-header";
import { DestinationDialog } from "@/components/travidy/dialogs";
import { EXPLORE_CATEGORIES, destinations, type Destination } from "@/lib/destinations";
import { usePrefs } from "@/lib/prefs";
import { img } from "@/lib/travidy";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Destinations — Travidy" },
      {
        name: "description",
        content:
          "Search handpicked Indian destinations by vibe — adventure, spiritual, beaches, nature or culture — and start planning in one tap.",
      },
      { property: "og:title", content: "Explore Destinations — Travidy" },
      {
        property: "og:description",
        content: "Discover where to go next with your AI travel buddy.",
      },
    ],
  }),
  component: Explore,
});

function Explore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [detail, setDetail] = useState<Destination | null>(null);
  const { prefs, toggleSaved } = usePrefs();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((d) => {
      const matchesCategory = category === "All" || d.categories.includes(category);
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.categories.some((c) => c.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [query, category]);

  return (
    <PhoneShell>
      <AppHeader />
      <div className="space-y-4 p-4">
        <h1 className="sr-only">Explore destinations</h1>

        <div className="relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations, vibes, activities..."
            aria-label="Search destinations"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pr-4 pl-10 text-xs shadow-card outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {EXPLORE_CATEGORIES.map((c) => (
            <li key={c}>
              <button
                onClick={() => setCategory(c)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shadow-card transition-colors ${
                  category === c
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>

        <div className="relative flex h-36 items-end overflow-hidden rounded-2xl bg-accent p-4 shadow-card">
          <img
            src={img("rishikesh")}
            alt="Weekend getaway inspiration"
            loading="lazy"
            width={768}
            height={768}
            className="absolute inset-0 size-full object-cover opacity-45"
          />
          <div className="relative space-y-1">
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground uppercase">
              Editor's Choice
            </span>
            <h2 className="text-base leading-tight text-accent-foreground">
              Handpicked Weekend Getaways
            </h2>
            <p className="text-[11px] font-medium text-accent-foreground/80">
              Curated by travel experts & verified travellers.
            </p>
          </div>
        </div>

        <h2 className="text-sm font-semibold">Explore Destinations ({filtered.length})</h2>

        {filtered.length === 0 ? (
          <div className="space-y-2 rounded-2xl bg-card p-8 text-center shadow-card">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <SearchX className="size-6 text-muted-foreground" />
            </span>
            <h3 className="text-sm font-semibold">No destinations found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search terms or filter selections.
            </p>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {filtered.map((d) => {
              const saved = prefs.saved.includes(d.id);
              return (
                <li key={d.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
                  <button onClick={() => setDetail(d)} className="block w-full text-left">
                    <span className="relative block">
                      <img
                        src={img(d.imageKey)}
                        alt={d.name}
                        loading="lazy"
                        width={768}
                        height={768}
                        className="h-36 w-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {d.tag}
                      </span>
                    </span>
                    <span className="block p-3.5">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-display text-sm font-bold">{d.name}</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-primary">
                          <Star className="size-3 fill-primary" /> {d.rating}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {d.categories.join(" • ")}
                      </span>
                      <span className="mt-2 block text-xs text-muted-foreground">{d.tagline}</span>
                    </span>
                  </button>
                  <div className="flex items-center justify-between border-t border-border px-3.5 py-2.5">
                    <span className="text-xs font-bold text-primary">{d.price}</span>
                    <div className="flex items-center gap-2">
                      <button
                        aria-label={saved ? `Remove ${d.name} from saved` : `Save ${d.name}`}
                        aria-pressed={saved}
                        onClick={() => toggleSaved(d.id)}
                        className="flex size-8 items-center justify-center rounded-full bg-muted"
                      >
                        <Heart
                          className={`size-4 ${saved ? "fill-adventure text-adventure" : "text-muted-foreground"}`}
                        />
                      </button>
                      <Link
                        to="/planner"
                        search={{ dest: d.id }}
                        className="flex items-center gap-1 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-bold text-accent-foreground"
                      >
                        Plan Trip <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <DestinationDialog
        open={detail !== null}
        onOpenChange={(v) => !v && setDetail(null)}
        destination={detail}
      />
    </PhoneShell>
  );
}
