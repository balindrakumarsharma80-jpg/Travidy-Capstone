import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LogIn, Users } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Card, PhoneShell, TravidyLogo } from "@/components/travidy/shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/trips/$tripId/join")({
  head: () => ({
    meta: [
      { title: "Join a trip — Travidy" },
      {
        name: "description",
        content: "Accept an invite and collaborate on a Travidy trip plan with your companions.",
      },
      { property: "og:title", content: "Join a trip — Travidy" },
      { property: "og:description", content: "Collaborate on a shared Travidy itinerary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JoinTrip,
});

function JoinTrip() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  const join = useMutation({
  mutationFn: async () => {
    if (!user) throw new Error("not signed in");

    const { data: existing, error: checkError } = await supabase
      .from("trip_collaborators")
      .select("trip_id, user_id, role")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) throw checkError;

    // Already a collaborator — nothing to insert.
    if (existing) {
      return;
    }

    const { error } = await supabase
      .from("trip_collaborators")
      .insert({
        trip_id: tripId,
        user_id: user.id,
        role: "editor",
      } as never);

    if (error) throw error;
  },

  onSuccess: () => {
    toast.success("You're on the trip");
    navigate({
      to: "/itinerary",
      search: { trip: tripId },
    });
  },

  onError: (error) => {
    console.error("JOIN TRIP ERROR:", error);
    toast.error("Couldn't join this trip. Ask the owner to re-send the invite.");
  },
});
  useEffect(() => {
    if (isAuthenticated && !join.isPending && !join.isSuccess) join.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <PhoneShell>
      <div className="p-6 text-center">
        <TravidyLogo />
        <Card className="mt-6">
          <Users className="mx-auto size-6 text-primary" />
          <h1 className="mt-2 font-display text-lg font-bold">Join this trip</h1>
          {loading ? (
            <Loader2 className="mx-auto mt-4 size-5 animate-spin text-primary" />
          ) : isAuthenticated ? (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Adding you as a collaborator so you can edit the plan together.
              </p>
              <Button className="mt-4" onClick={() => join.mutate()} disabled={join.isPending}>
                {join.isPending && <Loader2 className="size-4 animate-spin" />} Join trip
              </Button>
            </>
          ) : (
            <>
  <p className="mt-1 text-xs text-muted-foreground">
    Sign in first — collaborators are linked to your account.
  </p>

  <a
   href={`/auth?trip=${tripId}&join=true`}
  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
>
  <LogIn className="size-4" />
  Sign in
</a>
</>
          )}
        </Card>
      </div>
    </PhoneShell>
  );
}
