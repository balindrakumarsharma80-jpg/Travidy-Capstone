import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, HeartOff } from "lucide-react";

import { PhoneShell, Card } from "@/components/travidy/shell";
import { AppHeader } from "@/components/travidy/app-header";
import { destinations } from "@/lib/destinations";
import { usePrefs } from "@/lib/prefs";
import { img } from "@/lib/travidy";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Destinations — Travidy" },
      {
        name: "description",
        content:
          "Your bookmarked destinations, ready to turn into a full itinerary whenever you are.",
      },
      { property: "og:title", content: "Saved Destinations — Travidy" },
      {
        property: "og:description",
        content: "Your bookmarked spots for quick planning with Travidy.",
      },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { prefs, toggleSaved } = usePrefs();
  const saved = destinations.filter((d) => prefs.saved.includes(d.id));

  return (
    <PhoneShell>
      <AppHeader />
      <div className="space-y-4 p-4">
        <Card className="flex items-center justify-between">
          <div>
            <h1 className="text-base">Saved Destinations</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your bookmarked spots for quick planning
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-adventure-soft text-xs font-bold text-adventure">
            {saved.length}
          </span>
        </Card>

        {saved.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-adventure-soft shadow-card">
              <HeartOff className="size-8 text-adventure" />
            </span>
            <div>
              <h2 className="text-xl">Nothing saved yet</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tap the heart on any destination and it will show up here.
              </p>
            </div>
            <Link
              to="/explore"
              className="mt-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-card"
            >
              Browse Destinations
            </Link>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {saved.map((d) => (
              <li key={d.id} className="flex overflow-hidden rounded-2xl bg-card shadow-card">
                <img
                  src={img(d.imageKey)}
                  alt={d.name}
                  loading="lazy"
                  width={768}
                  height={768}
                  className="size-28 shrink-0 object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-sm">{d.name}</h2>
                      <button
                        aria-label={`Remove ${d.name} from saved`}
                        onClick={() => toggleSaved(d.id)}
                        className="rounded-full p-1"
                      >
                        <Heart className="size-4 fill-adventure text-adventure" />
                      </button>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {d.categories.join(" • ")}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{d.price}</span>
                    <Link
                      to="/planner"
                      search={{ dest: d.id }}
                      className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
                    >
                      Plan Now
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PhoneShell>
  );
}
