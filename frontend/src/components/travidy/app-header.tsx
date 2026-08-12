import { Link } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Briefcase,
  Heart,
  Home,
  LogIn,
  Menu,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import { useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TravidyLogo } from "@/components/travidy/shell";
import { HowItWorksDialog, NotificationsDialog } from "@/components/travidy/dialogs";
import { useAuth } from "@/hooks/use-auth";

const menu = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/trips", label: "My Trips", icon: Briefcase },
  { to: "/planner", label: "AI Trip Planner", icon: Sparkles },
  { to: "/journal", label: "Personal Journal", icon: BookOpen },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

/** Shared app bar: burger menu + logo + notification bell. */
export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger aria-label="Menu" className="text-foreground">
          <Menu className="size-6" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-5">
          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
          </SheetHeader>
          <TravidyLogo />
          <nav className="mt-6">
            <ul className="space-y-1">
              {menu.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    {...(to === "/planner" ? { search: { dest: undefined } } : {})}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    <Icon className="size-4 text-primary" /> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <button
            onClick={() => {
              setMenuOpen(false);
              setHowOpen(true);
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-soft py-2.5 text-xs font-bold text-accent-foreground"
          >
            <Sparkles className="size-4 text-primary" /> How Travidy Works
          </button>
          {!isAuthenticated && (
            <Link
              to="/auth"
              onClick={() => setMenuOpen(false)}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
            >
              <LogIn className="size-4" /> Sign in to sync
            </Link>
          )}
        </SheetContent>
      </Sheet>

      <TravidyLogo />

      <div className="flex items-center gap-3">
        {!isAuthenticated && (
          <Link
            to="/auth"
            aria-label="Sign in"
            className="rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold text-accent-foreground"
          >
            Sign in
          </Link>
        )}
        <button
          aria-label="Notifications"
          onClick={() => setNotifOpen(true)}
          className="relative text-foreground"
        >
          <Bell className="size-6" />
          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary" />
        </button>
      </div>

      <NotificationsDialog open={notifOpen} onOpenChange={setNotifOpen} />

      <HowItWorksDialog open={howOpen} onOpenChange={setHowOpen} />
    </header>
  );
}
