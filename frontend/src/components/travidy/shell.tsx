import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Briefcase, Heart, User, Compass } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Phone-width app shell: keeps the mobile design centred on larger screens. */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background shadow-float">
        <div className="flex-1 pb-24">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/planner", label: "My Trips", icon: Briefcase },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 z-30 w-full max-w-[430px] border-t border-border bg-surface/95 backdrop-blur">
      <ul className="flex items-stretch justify-between px-2 pt-2 pb-3">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active =
            pathname === to || (to === "/planner" && pathname.startsWith("/itinerary"));
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TravidyLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <Compass className="size-6 text-primary" strokeWidth={2.4} />
      <span className="font-display text-xl font-bold text-primary">Travidy</span>
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl bg-card p-4 shadow-card", className)}>{children}</div>
  );
}

export function Loading() {
  return (
    <div className="space-y-3 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
