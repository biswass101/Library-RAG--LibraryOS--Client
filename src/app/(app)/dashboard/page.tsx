"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookCopy,
  BookOpenCheck,
  BookPlus,
  CalendarClock,
  FileText,
  Library,
  MessageSquareText,
  Undo2,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { BorrowTrendChart, CategoryPieChart, MonthlyStatsChart } from "@/components/charts/charts";
import { ChartCard } from "@/features/dashboard/chart-card";
import { StatCard } from "@/features/dashboard/stat-card";
import {
  MostBorrowedWidget,
  NewestMembersWidget,
  RecentActivityWidget,
  UpcomingDueWidget,
} from "@/features/dashboard/widgets";
import { dashboardApi } from "@/lib/api/services";

export default function DashboardPage() {
  const stats = useQuery({ queryKey: ["dashboard", "stats"], queryFn: dashboardApi.stats });
  const trend = useQuery({ queryKey: ["dashboard", "trend"], queryFn: dashboardApi.borrowTrend });
  const popular = useQuery({ queryKey: ["dashboard", "popular"], queryFn: dashboardApi.popularCategories });
  const monthly = useQuery({ queryKey: ["dashboard", "monthly"], queryFn: dashboardApi.monthlyStats });

  const cards = [
    { title: "Total Books", value: stats.data?.totalBooks, icon: Library, delta: stats.data?.totalBooksDelta, iconClassName: "bg-primary/10 text-primary" },
    { title: "Borrowed Books", value: stats.data?.borrowedBooks, icon: BookCopy, delta: stats.data?.borrowedDelta, iconClassName: "bg-chart-2/15 text-chart-2" },
    { title: "Returned Books", value: stats.data?.returnedBooks, icon: Undo2, delta: stats.data?.returnedDelta, iconClassName: "bg-chart-3/15 text-chart-3" },
    { title: "Available Books", value: stats.data?.availableBooks, icon: BookOpenCheck, hint: "Copies on shelves", iconClassName: "bg-chart-4/15 text-chart-4" },
    { title: "Members", value: stats.data?.members, icon: Users, delta: stats.data?.membersDelta, iconClassName: "bg-chart-5/15 text-chart-5" },
    { title: "Librarians", value: stats.data?.librarians, icon: UserCog, hint: "Active staff accounts", iconClassName: "bg-primary/10 text-primary" },
    { title: "Documents", value: stats.data?.documents, icon: FileText, hint: "Indexed for AI search", iconClassName: "bg-chart-2/15 text-chart-2" },
    { title: "Reservations", value: stats.data?.activeReservations, icon: CalendarClock, hint: "Pending or ready", iconClassName: "bg-chart-4/15 text-chart-4" },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Dashboard"
        description="A live overview of your library's catalog, circulation and members."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/chat">
                <MessageSquareText data-icon="inline-start" />
                Ask AI
              </Link>
            </Button>
            <Button asChild>
              <Link href="/books/new">
                <BookPlus data-icon="inline-start" />
                Add Book
              </Link>
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <StatCard key={card.title} {...card} index={i} isLoading={stats.isPending} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Borrow Trend"
            description="Books borrowed vs returned over the last 12 months"
            isLoading={trend.isPending}
            isError={trend.isError}
            onRetry={() => trend.refetch()}
          >
            {trend.data ? <BorrowTrendChart data={trend.data} /> : null}
          </ChartCard>
        </div>
        <ChartCard
          title="Popular Categories"
          description="Share of total borrows"
          isLoading={popular.isPending}
          isError={popular.isError}
          onRetry={() => popular.refetch()}
        >
          {popular.data ? <CategoryPieChart data={popular.data} /> : null}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Monthly Statistics"
            description="New members, new books and fines collected"
            isLoading={monthly.isPending}
            isError={monthly.isError}
            onRetry={() => monthly.refetch()}
            height={280}
          >
            {monthly.data ? <MonthlyStatsChart data={monthly.data} /> : null}
          </ChartCard>
        </div>
        <UpcomingDueWidget />
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <RecentActivityWidget />
        <MostBorrowedWidget />
        <NewestMembersWidget />
      </div>
    </div>
  );
}
