import type { ChecklistItem, ItineraryItem, Trip } from "@/lib/travidy";
import { dateRange, dayLabel, inr } from "@/lib/travidy";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Builds a print-ready document of the itinerary and opens the browser's
 * print dialog, where the traveller can save it as a PDF.
 */
export function exportItineraryPdf(trip: Trip, items: ItineraryItem[], checklist: ChecklistItem[]) {
  const days = Array.from({ length: trip.days }, (_, i) => i + 1);
  const rows = days
    .map((d) => {
      const dayItems = items.filter((i) => i.day === d);
      const list = dayItems.length
        ? dayItems
            .map(
              (i) => `<tr>
                <td class="t">${esc(i.time_label)}</td>
                <td><strong>${esc(i.title)}</strong>${i.place ? `<div class="m">${esc(i.place)}</div>` : ""}</td>
                <td>${esc(i.price_label ?? "—")}</td>
                <td>${esc(i.duration ?? "—")}</td>
                <td>${i.status === "completed" ? "Done" : "Planned"}</td>
              </tr>`,
            )
            .join("")
        : `<tr><td colspan="5" class="m">Nothing planned for this day.</td></tr>`;
      return `<h2>Day ${d} <span class="m">${esc(dayLabel(trip.start_date, d))}</span></h2>
        <table><thead><tr><th>Time</th><th>Activity</th><th>Cost</th><th>Duration</th><th>Status</th></tr></thead>
        <tbody>${list}</tbody></table>`;
    })
    .join("");

  const tasks = checklist.length
    ? `<ul>${checklist.map((c) => `<li>${c.done ? "☑" : "☐"} ${esc(c.label)}</li>`).join("")}</ul>`
    : `<p class="m">No checklist items yet.</p>`;

  const html = `<!doctype html><html><head><meta charset="utf-8" />
    <title>${esc(trip.title)} — Travidy itinerary</title>
    <style>
      @page { margin: 18mm; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#111827; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      h2 { font-size: 15px; margin: 22px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
      .m { color:#6b7280; font-weight: 400; font-size: 12px; }
      .head { color:#16a34a; font-weight:700; letter-spacing:.08em; font-size:11px; text-transform:uppercase; }
      table { width:100%; border-collapse: collapse; font-size:12px; }
      th { text-align:left; color:#6b7280; font-weight:600; padding:6px 6px 6px 0; }
      td { padding:6px 6px 6px 0; border-top:1px solid #f3f4f6; vertical-align: top; }
      td.t { white-space: nowrap; width: 70px; color:#6b7280; }
      ul { padding-left: 18px; font-size: 12px; }
      li { margin: 3px 0; }
      .facts { font-size:12px; color:#374151; margin-top:6px; }
    </style></head>
    <body>
      <p class="head">Travidy</p>
      <h1>${esc(trip.title)}</h1>
      <p class="facts">${esc(trip.destination)} • ${esc(dateRange(trip.start_date, trip.end_date))} • ${trip.travellers ?? trip.travelers} travellers • Budget ${esc(inr(trip.budget_amount ?? trip.budget))}</p>
      ${rows}
      <h2>Trip checklist</h2>
      ${tasks}
    </body></html>`;

  const w = window.open("", "_blank", "noopener,width=900,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
  return true;
}
