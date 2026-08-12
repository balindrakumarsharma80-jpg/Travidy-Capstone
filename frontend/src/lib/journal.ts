import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const JOURNAL_BUCKET = "trip-media";

export type JournalEntry = {
  id: string;
  user_id: string;
  trip_id: string | null;
  title: string | null;
  body: string | null;
  media_urls: string[];
  status: string;
  created_at: string;
  updated_at: string;
};

export const journalQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["journal", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_posts")
        .select("*")
        .eq("user_id", userId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as JournalEntry[];
    },
  });

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60);

/** Uploads one media file into the private bucket, returns its storage path. */
export async function uploadJournalMedia(
  userId: string,
  tripId: string | null,
  file: File | Blob,
  filename: string,
) {
  const path = `${userId}/${tripId ?? "general"}/${Date.now()}-${safeName(filename)}`;
  const { error } = await supabase.storage
    .from(JOURNAL_BUCKET)
    .upload(path, file, { contentType: (file as File).type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

/** Signed URLs for private media, valid for an hour. */
export async function signedUrls(paths: string[]) {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(JOURNAL_BUCKET).createSignedUrls(paths, 3600);
  if (error) throw error;
  const map: Record<string, string> = {};
  (data ?? []).forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}

export const mediaKind = (path: string) => {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video" as const;
  if (["wav", "mp3", "m4a", "ogg", "aac"].includes(ext)) return "audio" as const;
  return "image" as const;
};
