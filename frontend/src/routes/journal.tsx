import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ImagePlus,
  Loader2,
  Lock,
  LogIn,
  Mic,
  PenLine,
  Square,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/travidy/app-header";
import { Card, PhoneShell } from "@/components/travidy/shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  journalQuery,
  mediaKind,
  signedUrls,
  uploadJournalMedia,
  type JournalEntry,
} from "@/lib/journal";
import { myTripsQuery } from "@/lib/trips";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Personal Journal — Travidy" },
      {
        name: "description",
        content:
          "A private travel journal: capture photos, videos from your trip. Only you can see it.",
      },
      { property: "og:title", content: "Personal Journal — Travidy" },
      {
        property: "og:description",
        content: "Your private Travidy journal — media and notes from every trip.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Journal,
});

const emptyDraft = { tripId: "", title: "", body: "" };

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Journal() {
  const qc = useQueryClient();
  const { user, isAuthenticated, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<{ id: string; title: string; body: string } | null>(null);

  const { data: entries = [], isLoading } = useQuery(journalQuery(user?.id));
  const { data: trips = [] } = useQuery(myTripsQuery(user?.id));

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not signed in");
      const tripId = draft.tripId || null;
      const paths: string[] = [];
      for (const f of files) paths.push(await uploadJournalMedia(user.id, tripId, f, f.name));

      const { error } = await supabase.from("trip_posts").insert({
        user_id: user.id,
        trip_id: tripId,
        title: draft.title.trim() || null,
        body: draft.body.trim() || null,
        media_urls: paths,
        status: "active",
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      setOpen(false);
      setDraft(emptyDraft);
      setFiles([]);
      toast.success("Saved to your private journal");
    },
    onError: () => toast.error("Couldn't save that entry. Please try again."),
  });

  const edit = useMutation({
    mutationFn: async (e: { id: string; title: string; body: string }) => {
      const { error } = await supabase
        .from("trip_posts")
        .update({ title: e.title.trim() || null, body: e.body.trim() || null } as never)
        .eq("id", e.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      setEditing(null);
      toast.success("Entry updated");
    },
    onError: () => toast.error("Couldn't save your changes."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trip_posts")
        .update({ status: "removed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      toast.success("Entry removed");
    },
    onError: () => toast.error("Couldn't remove that entry."),
  });

  return (
    <PhoneShell>
      <AppHeader />
      <div className="space-y-4 p-4 pb-24">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">Personal Journal</h1>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" /> Private to you — nothing is shared.
            </p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} disabled={!isAuthenticated}>
            <PenLine className="size-4" /> Add
          </Button>
        </div>

        {!isAuthenticated && !loading && (
          <Card className="text-center">
            <BookOpen className="mx-auto size-6 text-primary" />
            <h2 className="mt-2 text-sm font-semibold">Sign in to start your journal</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Entries and media are stored privately against your account.
            </p>
            <Link
              to="/auth"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              <LogIn className="size-4" /> Sign in
            </Link>
          </Card>
        )}

        {isAuthenticated && isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}

        {isAuthenticated && !isLoading && entries.length === 0 && (
          <Card className="text-center">
            <h2 className="text-sm font-semibold">Nothing captured yet</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a photo, a video from your trip.
            </p>
          </Card>
        )}

        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id}>
              <JournalCard
                entry={e}
                tripName={trips.find((t) => t.id === e.trip_id)?.title}
                onEdit={() => setEditing({ id: e.id, title: e.title ?? "", body: e.body ?? "" })}
                onDelete={() => remove.mutate(e.id)}
              />
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-[380px] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>New journal entry</DialogTitle>
            <DialogDescription>Only you will ever see this.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="j-trip">Trip (optional)</Label>
              <select
                id="j-trip"
                value={draft.tripId}
                onChange={(e) => setDraft((d) => ({ ...d, tripId: e.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">Not linked to a trip</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-title">Title</Label>
              <Input
                id="j-title"
                value={draft.title}
                placeholder="Sunrise at Triveni Ghat"
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-body">Notes</Label>
              <Textarea
                id="j-body"
                rows={5}
                value={draft.body}
                placeholder="What happened, how it felt, what you'd do differently…"
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 font-semibold"
              >
                <ImagePlus className="size-4 text-primary" /> Photo / video
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </div>
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {files.length > 0 && `${files.length} file(s) attached`}
                {files.length > 0 && " • "}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => save.mutate()}
              disabled={
                save.isPending || (!draft.title.trim() && !draft.body.trim() && !files.length)
              }
            >
              {save.isPending && <Loader2 className="size-4 animate-spin" />} Save entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[85vh] max-w-[380px] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit entry</DialogTitle>
            <DialogDescription>
              Tidy up the transcription or your notes — media stays attached.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="e-title">Title</Label>
                <Input
                  id="e-title"
                  value={editing.title}
                  onChange={(ev) => setEditing((s) => (s ? { ...s, title: ev.target.value } : s))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-body">Transcription / notes</Label>
                <Textarea
                  id="e-body"
                  rows={8}
                  value={editing.body}
                  onChange={(ev) => setEditing((s) => (s ? { ...s, body: ev.target.value } : s))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => editing && edit.mutate(editing)} disabled={edit.isPending}>
              {edit.isPending && <Loader2 className="size-4 animate-spin" />} Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhoneShell>
  );
}

function JournalCard({
  entry,
  tripName,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  tripName?: string | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: urls = {} } = useQuery({
    queryKey: ["journal-media", entry.id, entry.media_urls],
    enabled: entry.media_urls.length > 0,
    queryFn: () => signedUrls(entry.media_urls),
    staleTime: 50 * 60 * 1000,
  });

  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{entry.title ?? "Untitled entry"}</h2>
          <p className="text-[11px] text-muted-foreground">
            {when(entry.created_at)}
            {tripName ? ` • ${tripName}` : ""}
          </p>
        </div>
        <button
          aria-label="Edit entry"
          onClick={onEdit}
          className="text-muted-foreground hover:text-primary"
        >
          <PenLine className="size-4" />
        </button>
        <button
          aria-label="Delete entry"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {entry.body && <p className="whitespace-pre-wrap text-sm">{entry.body}</p>}
      {entry.media_urls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {entry.media_urls.map((path) => {
            const url = urls[path];
            const kind = mediaKind(path);
            if (!url) return <div key={path} className="h-24 animate-pulse rounded-xl bg-muted" />;
            if (kind === "image")
              return (
                <img
                  key={path}
                  src={url}
                  alt={entry.title ?? "Journal media"}
                  loading="lazy"
                  className="h-24 w-full rounded-xl object-cover"
                />
              );
            if (kind === "video")
              return <video key={path} src={url} controls className="h-24 w-full rounded-xl" />;
            return <audio key={path} src={url} controls className="col-span-2 w-full" />;
          })}
        </div>
      )}
    </Card>
  );
}
