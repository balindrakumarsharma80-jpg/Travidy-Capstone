import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import demoVideo from "@/assets/travidy-demo.mp4.asset.json";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

/** Plays the Travidy product demo video. */
export function DemoVideoDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Travidy Demo</DialogTitle>
          <DialogDescription className="text-xs">
            See how Travidy plans, guides and remembers your trip.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <video
            src={demoVideo.url}
            controls
            autoPlay
            playsInline
            className="w-full rounded-xl bg-muted"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
