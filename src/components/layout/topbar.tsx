"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { CommandPalette } from "@/components/layout/command-palette";
import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/features/auth/auth-context";
import { initials } from "@/lib/format";

export function Topbar() {
  const { user, logout } = useAuth();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <AppBreadcrumb />

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          className="hidden w-56 justify-start text-muted-foreground sm:inline-flex"
          onClick={() => setPaletteOpen(true)}
        >
          <Search data-icon="inline-start" />
          <span className="flex-1 text-left text-sm font-normal">Search…</span>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={() => setPaletteOpen(true)}>
          <Search />
        </Button>

        <ThemeToggle />
        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-1.5" aria-label="Open profile menu">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {user ? initials(user.name) : "??"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">{user?.name.split(" ")[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserRound aria-hidden />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings aria-hidden />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={logout}>
              <LogOut aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
