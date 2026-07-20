"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookCopy,
  BookPlus,
  CalendarClock,
  FileText,
  History,
  Landmark,
  UserPlus,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { dashboardApi } from "@/lib/api/services";
import { daysUntil, formatDate, formatRelative, initials } from "@/lib/format";
import type { ActivityType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  borrow: { icon: BookCopy, className: "bg-primary/10 text-primary" },
  return: { icon: Undo2, className: "bg-success/12 text-success" },
  member: { icon: UserPlus, className: "bg-chart-2/15 text-chart-2" },
  book: { icon: BookPlus, className: "bg-chart-5/15 text-chart-5" },
  fine: { icon: Landmark, className: "bg-warning/15 text-warning" },
  reservation: { icon: CalendarClock, className: "bg-chart-4/15 text-chart-4" },
  document: { icon: FileText, className: "bg-muted text-muted-foreground" },
};

function WidgetCard({
  title,
  description,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  description: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {href ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={href}>
                {hrefLabel ?? "View all"}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentActivityWidget() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: dashboardApi.recentActivity,
  });

  return (
    <WidgetCard title="Recent Activity" description="Latest events across the library">
      {isPending ? (
        <RowsSkeleton rows={6} />
      ) : isError ? (
        <ErrorState className="py-6" onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState icon={History} title="No recent activity" className="py-8" />
      ) : (
        <ol className="relative space-y-0">
          {data.map((activity, i) => {
            const meta = ACTIVITY_META[activity.type];
            const Icon = meta.icon;
            const isLast = i === data.length - 1;
            return (
              <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
                {!isLast ? (
                  <span aria-hidden className="absolute left-[17px] top-9 h-[calc(100%-2rem)] w-px bg-border" />
                ) : null}
                <span className={cn("z-10 flex size-9 shrink-0 items-center justify-center rounded-full", meta.className)}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium leading-tight">{activity.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{activity.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {activity.actor} · {formatRelative(activity.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </WidgetCard>
  );
}

export function UpcomingDueWidget() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dashboard", "upcoming-due"],
    queryFn: dashboardApi.upcomingDue,
  });

  return (
    <WidgetCard title="Upcoming Due Books" description="Loans due in the next days" href="/borrows">
      {isPending ? (
        <RowsSkeleton rows={5} />
      ) : isError ? (
        <ErrorState className="py-6" onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState icon={CalendarClock} title="Nothing due soon" description="All active loans have comfortable due dates." className="py-8" />
      ) : (
        <ul className="space-y-3.5">
          {data.map((borrow) => {
            const days = daysUntil(borrow.dueAt);
            const urgent = days <= 2;
            return (
              <li key={borrow.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{borrow.bookTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">{borrow.memberName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("text-xs font-semibold", urgent ? "text-destructive" : "text-muted-foreground")}>
                    {days === 0 ? "Due today" : `${days} day${days > 1 ? "s" : ""}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">{formatDate(borrow.dueAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}

export function MostBorrowedWidget() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dashboard", "most-borrowed"],
    queryFn: dashboardApi.mostBorrowed,
  });

  const max = data?.[0]?.borrowCount ?? 1;

  return (
    <WidgetCard title="Most Borrowed Books" description="All-time circulation leaders" href="/books">
      {isPending ? (
        <RowsSkeleton rows={5} />
      ) : isError ? (
        <ErrorState className="py-6" onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState icon={BookCopy} title="No borrow data yet" className="py-8" />
      ) : (
        <ul className="space-y-4">
          {data.map((book, i) => (
            <li key={book.id}>
              <Link href={`/books/${book.id}`} className="group block">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                      style={{ backgroundColor: book.coverColor }}
                    >
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium group-hover:text-primary">{book.title}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{book.borrowCount} loans</span>
                </div>
                <Progress value={(book.borrowCount / max) * 100} className="h-1.5" aria-label={`${book.title}: ${book.borrowCount} loans`} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function NewestMembersWidget() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dashboard", "newest-members"],
    queryFn: dashboardApi.newestMembers,
  });

  return (
    <WidgetCard title="Newest Members" description="Recently joined readers" href="/members">
      {isPending ? (
        <RowsSkeleton rows={5} />
      ) : isError ? (
        <ErrorState className="py-6" onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState icon={UserPlus} title="No members yet" className="py-8" />
      ) : (
        <ul className="space-y-3.5">
          {data.map((member) => (
            <li key={member.id}>
              <Link href={`/members/${member.id}`} className="group flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium group-hover:text-primary">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">Joined {formatRelative(member.joinedAt)}</p>
                </div>
                <StatusBadge status={member.plan} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
