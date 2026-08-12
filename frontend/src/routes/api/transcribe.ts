import { createFileRoute } from "@tanstack/react-router";

const MAX_BYTES = 20 * 1024 * 1024;

/** Speech-to-text for story dictation. Audio is uploaded as a complete WAV file. */
export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "Transcription is not configured." }, { status: 500 });
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "Expected an audio upload." }, { status: 400 });
        }

        const audio = form.get("audio");
        if (!(audio instanceof File) || audio.size < 2048) {
          return Response.json(
            { error: "That recording was empty — please try again." },
            { status: 400 },
          );
        }
        if (audio.size > MAX_BYTES) {
          return Response.json({ error: "That recording is too long." }, { status: 413 });
        }

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-transcribe");
        upstream.append("file", audio, "recording.wav");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstream,
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`Transcription failed [${res.status}]: ${body}`);
          const message =
            res.status === 402
              ? "AI credits are exhausted — add credits to keep transcribing."
              : res.status === 429
                ? "Too many requests right now. Try again in a moment."
                : "Couldn't transcribe that recording.";
          return Response.json({ error: message }, { status: res.status });
        }

        const data = (await res.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
