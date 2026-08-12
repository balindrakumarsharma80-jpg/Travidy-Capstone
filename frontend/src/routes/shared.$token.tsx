import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Circle, Lock, MapPin, Users } from "lucide-react";

import { Card, PhoneShell, TravidyLogo } from "@/components/travidy/shell";
import { getSharedTrip, type SharedTrip } from "@/lib/share.functions";

export const Route = createFileRoute("/shared/$token")({
  loader: ({ params }) => getSharedTrip({ data: { token: params.token } }),
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — shared on Travidy` : "Shared trip — Travidy";
    const description = loaderData
      ? `A read-only Travidy plan for ${loaderData.destination}: ${loaderData.days} days, ${loaderData.items.length} planned stops.`
      : "This shared Travidy trip is no longer available.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  errorComponent: () => <SharedFallback message="We couldn't load this shared trip." />,
  notFoundComponent: () => <SharedFallback message="This shared trip link is not valid." />,
  component: SharedTripPage,
});

function SharedFallback({ message }: { message: string }) {
  return (
    <PhoneShell>
      <div className="p-6 text-center">
        <TravidyLogo />
        <p className="mt-6 text-sm text-muted-foreground">{message}</p>
      </div>
    </PhoneShell>
  );
}

const fmt = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SharedTripPage() {
  const trip = Route.useLoaderData() as SharedTrip | null;
  if (!trip) return <SharedFallback message="This shared trip link is not valid." />;

  const days: number[] = [...new Set(trip.items.map((i) => i.day))].sort((a, b) => a - b);

  return (
    <PhoneShell>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <TravidyLogo />
        <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">
          <Lock className="size-3" /> Read only
        </span>
      </header>

      <div className="space-y-4 p-4 pb-24">
        <Card>
          <h1 className="font-display text-xl font-bold">{trip.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {trip.destination}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-start gap-1.5">
              <CalendarDays className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <dt className="font-semibold">{trip.days} days</dt>
                <dd className="text-muted-foreground">
                  {fmt(trip.startDate)} – {fmt(trip.endDate)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <Users className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <dt className="font-semibold">{trip.travellers} travellers</dt>
                <dd className="capitalize text-muted-foreground">{trip.status}</dd>
              </div>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-base">Itinerary</h2>
          {trip.items.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Nothing planned yet.</p>
          ) : (
            days.map((day) => (
              <div key={day} className="mt-3">
                <p className="text-xs font-bold uppercase text-primary">Day {day}</p>
                <ul className="mt-2 space-y-2">
                  {trip.items
                    .filter((i) => i.day === day)
                    .map((i) => (
                      <li key={i.id} className="rounded-xl border border-border p-3">
                        <p className="text-xs font-semibold text-muted-foreground">
                          {i.time_label}
                        </p>
                        <p className="text-sm font-semibold">{i.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {[i.place, i.category, i.duration].filter(Boolean).join(" • ")}
                        </p>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h2 className="text-base">Checklist</h2>
          {trip.checklist.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No tasks added yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {trip.checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  {c.done ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" />
                  )}
                  <span className={c.done ? "text-muted-foreground line-through" : ""}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PhoneShell>
  );
}
