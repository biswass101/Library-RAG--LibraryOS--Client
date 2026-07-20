"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BRAND, NAV_SECTIONS } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  onNavigate?: () => void;
}

/** Sidebar content — reused by the desktop rail and the mobile drawer. */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const BrandIcon = BRAND.icon;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <BrandIcon className="size-4.5" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">{BRAND.name}</p>
          <p className="text-[11px] text-muted-foreground">Smart Library Suite</p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav aria-label="Main navigation" className="space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            active ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                          )}
                          aria-hidden
                        />
                        <span className="truncate">{item.title}</span>
                        {item.badge ? (
                          <Badge variant="secondary" className="ml-auto bg-primary/10 text-[10px] text-primary">
                            {item.badge}
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t p-3">
        <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
          <p className="text-xs font-medium">Central Branch</p>
          <p className="text-[11px] text-muted-foreground">v2.4.0 · All systems normal</p>
        </div>
      </div>
    </div>
  );
}
