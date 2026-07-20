"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, BookOpen, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ErrorState } from "@/components/shared/error-state";
import {
  BorrowTrendChart,
  CategoryPieChart,
  MonthlyStatsChart,
  NamedBarChart,
  SharePieChart,
} from "@/components/charts/charts";
import { reportsApi } from "@/lib/api/services";
import { formatCurrency, formatDate } from "@/lib/format";

const FADE = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

function ReportCard({
  title,
  description,
  isLoading,
  isError,
  onRetry,
  children,
  height = 260,
}: {
  title: string;
  description?: string;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full rounded-lg" style={{ height }} />
        ) : isError ? (
          <ErrorState onRetry={onRetry} />
        ) : (
          <div style={{ height }}>{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Borrow Report ─── */
function BorrowReportTab() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["reports", "borrows"],
    queryFn: reportsApi.borrowReport,
  });

  const total = data?.byStatus.reduce((s, x) => s + x.value, 0) ?? 0;
  const overdue = data?.byStatus.find((x) => x.name === "overdue")?.value ?? 0;

  return (
    <motion.div className="space-y-4" {...FADE}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard icon={BarChart3} label="Total borrows" value={String(total)} color="bg-primary/10 text-primary" />
        <SummaryCard icon={BookOpen} label="Currently out" value={String(data?.byStatus.find((x) => x.name === "borrowed")?.value ?? "—")} color="bg-chart-2/15 text-chart-2" />
        <SummaryCard icon={BookOpen} label="Returned" value={String(data?.byStatus.find((x) => x.name === "returned")?.value ?? "—")} color="bg-chart-3/15 text-chart-3" />
        <SummaryCard icon={BookOpen} label="Overdue" value={String(overdue)} sub={overdue > 0 ? "Needs attention" : "All clear"} color={overdue > 0 ? "bg-destructive/10 text-destructive" : "bg-chart-3/15 text-chart-3"} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReportCard title="Borrow Trend" description="12-month comparison" isLoading={isPending} isError={isError} onRetry={refetch} height={260}>
            {data && <BorrowTrendChart data={data.trend} />}
          </ReportCard>
        </div>
        <ReportCard title="By Status" isLoading={isPending} isError={isError} onRetry={refetch} height={260}>
          {data && <SharePieChart data={data.byStatus} />}
        </ReportCard>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Borrow Records</CardTitle></CardHeader>
        <CardContent>
          {isPending ? <Skeleton className="h-48 w-full" /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.rows.slice(0, 10).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="max-w-40 truncate font-medium">{b.bookTitle}</TableCell>
                      <TableCell>{b.memberName}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(b.issuedAt)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(b.dueAt)}</TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                      <TableCell>{b.fine > 0 ? <span className="text-destructive font-medium">{formatCurrency(b.fine)}</span> : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Member Report ─── */
function MemberReportTab() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["reports", "members"],
    queryFn: reportsApi.memberReport,
  });

  const total = data?.byStatus.reduce((s, x) => s + x.value, 0) ?? 0;
  const active = data?.byStatus.find((x) => x.name === "active")?.value ?? 0;

  return (
    <motion.div className="space-y-4" {...FADE}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard icon={Users} label="Total members" value={String(total)} color="bg-primary/10 text-primary" />
        <SummaryCard icon={Users} label="Active" value={String(active)} color="bg-chart-3/15 text-chart-3" />
        <SummaryCard icon={Users} label="Suspended" value={String(data?.byStatus.find((x) => x.name === "suspended")?.value ?? "—")} color="bg-destructive/10 text-destructive" />
        <SummaryCard icon={Users} label="Expired" value={String(data?.byStatus.find((x) => x.name === "expired")?.value ?? "—")} color="bg-muted text-muted-foreground" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportCard title="By Plan" isLoading={isPending} isError={isError} onRetry={refetch} height={240}>
          {data && <NamedBarChart data={data.byPlan} color="var(--chart-1)" />}
        </ReportCard>
        <ReportCard title="By Status" isLoading={isPending} isError={isError} onRetry={refetch} height={240}>
          {data && <SharePieChart data={data.byStatus} />}
        </ReportCard>
      </div>
      <ReportCard title="Monthly Growth" description="New members per month" isLoading={isPending} isError={isError} onRetry={refetch} height={240}>
        {data && <MonthlyStatsChart data={data.growth} />}
      </ReportCard>
      <Card>
        <CardHeader><CardTitle className="text-base">Top Borrowers</CardTitle></CardHeader>
        <CardContent>
          {isPending ? <Skeleton className="h-48 w-full" /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Total borrows</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Fines</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.top.map((m, i) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground font-mono">#{i + 1}</TableCell>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{m.plan}</TableCell>
                      <TableCell className="tabular-nums font-medium">{m.totalBorrows}</TableCell>
                      <TableCell className="tabular-nums">{m.activeBorrows}</TableCell>
                      <TableCell>{m.outstandingFines > 0 ? <span className="text-destructive">{formatCurrency(m.outstandingFines)}</span> : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Book Report ─── */
function BookReportTab() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["reports", "books"],
    queryFn: reportsApi.bookReport,
  });

  return (
    <motion.div className="space-y-4" {...FADE}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportCard title="Books by Category" isLoading={isPending} isError={isError} onRetry={refetch} height={260}>
          {data && <NamedBarChart data={data.byCategory} color="var(--chart-2)" horizontal />}
        </ReportCard>
        <Card>
          <CardHeader><CardTitle className="text-base">Low Stock Alert</CardTitle><CardDescription>Books with 0–2 copies available</CardDescription></CardHeader>
          <CardContent>
            {isPending ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {data?.lowStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All books well stocked.</p>
                ) : data?.lowStock.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="max-w-44 truncate text-sm font-medium">{b.title}</p>
                      <p className="text-xs text-muted-foreground">{b.categoryName}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Most Borrowed Books</CardTitle></CardHeader>
        <CardContent>
          {isPending ? <Skeleton className="h-48 w-full" /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Borrows</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.top.map((b, i) => (
                    <TableRow key={b.id}>
                      <TableCell className="text-muted-foreground font-mono">#{i + 1}</TableCell>
                      <TableCell className="max-w-44 truncate font-medium">{b.title}</TableCell>
                      <TableCell className="text-muted-foreground">{b.categoryName}</TableCell>
                      <TableCell className="text-muted-foreground">{b.authorName}</TableCell>
                      <TableCell className="tabular-nums font-semibold">{b.borrowCount}</TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Fine Report ─── */
function FineReportTab() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["reports", "fines"],
    queryFn: reportsApi.fineReport,
  });

  return (
    <motion.div className="space-y-4" {...FADE}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={DollarSign} label="Total fines issued" value={data ? formatCurrency(data.total) : "—"} color="bg-primary/10 text-primary" />
        <SummaryCard icon={DollarSign} label="Collected" value={data ? formatCurrency(data.collected) : "—"} color="bg-chart-3/15 text-chart-3" />
        <SummaryCard icon={DollarSign} label="Outstanding" value={data ? formatCurrency(data.outstanding) : "—"} color={data && data.outstanding > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportCard title="By Status" isLoading={isPending} isError={isError} onRetry={refetch} height={240}>
          {data && <SharePieChart data={data.byStatus} />}
        </ReportCard>
        <ReportCard title="Monthly Fines Collected" isLoading={isPending} isError={isError} onRetry={refetch} height={240}>
          {data && <NamedBarChart data={data.monthly.map((m) => ({ name: m.month, value: m.finesCollected }))} color="var(--chart-4)" />}
        </ReportCard>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Fines</CardTitle></CardHeader>
        <CardContent>
          {isPending ? <Skeleton className="h-48 w-full" /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.rows.slice(0, 10).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.memberName}</TableCell>
                      <TableCell className="max-w-40 truncate text-muted-foreground">{f.bookTitle}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatCurrency(f.amount)}</TableCell>
                      <TableCell><StatusBadge status={f.status} /></TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(f.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Reports Page ─── */
export default function ReportsPage() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Reports"
        description="Analyze circulation, membership, inventory, and financial data."
      />

      <Tabs defaultValue="borrows">
        <TabsList className="mb-4">
          <TabsTrigger value="borrows">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Borrows
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Members
          </TabsTrigger>
          <TabsTrigger value="books">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Books
          </TabsTrigger>
          <TabsTrigger value="fines">
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Fines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="borrows"><BorrowReportTab /></TabsContent>
        <TabsContent value="members"><MemberReportTab /></TabsContent>
        <TabsContent value="books"><BookReportTab /></TabsContent>
        <TabsContent value="fines"><FineReportTab /></TabsContent>
      </Tabs>
    </div>
  );
}
