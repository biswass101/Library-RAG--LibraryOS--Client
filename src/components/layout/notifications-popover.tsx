"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CalendarClock, CheckCheck, CircleAlert, FileText, Landmark, UserPlus, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationsApi } from "@/lib/api/services";
import { formatRelative } from "@/lib/format";
import type { NotificationType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_META: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  due: { icon: CalendarClock, className: "bg-warning/15 text-warning" },
  overdue: { icon: CircleAlert, className: "bg-destructive/10 text-destructive" },
  reservation: { icon: CalendarClock, className: "bg-primary/10 text-primary" },
  system: { icon: Wrench, className: "bg-muted text-muted-foreground" },
  fine: { icon: Landmark, className: "bg-success/12 text-success" },
  member: { icon: UserPlus, className: "bg-primary/10 text-primary" },
  document: { icon: FileText, className: "bg-muted text-muted-foreground" },
};

export function NotificationsPopover() {
  const queryClient = useQueryClient();
  const { data: notifications, isPending } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    refetchInterval: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: invalidate });

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} className="relative">
          <Bell />
          <AnimatePresence>
            {unread > 0 ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white"
              >
                {unread}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 ? <Badge variant="secondary">{unread} new</Badge> : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck data-icon="inline-start" />
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-[380px]">
          {isPending ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <BellOff className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">All caught up</p>
              <p className="text-xs text-muted-foreground">New notifications will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const meta = TYPE_META[n.type];
                const Icon = meta.icon;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.read && "bg-accent/40"
                      )}
                      onClick={() => !n.read && markRead.mutate(n.id)}
                    >
                      <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full", meta.className)}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{n.title}</span>
                          {!n.read ? <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.message}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/70">{formatRelative(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
