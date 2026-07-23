"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeftRight,
  BookCopy,
  Calendar,
  DollarSign,
  MoreHorizontal,
  RefreshCw,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { IssueBorrowDialog } from "@/features/borrows/issue-dialog";
import { borrowsApi } from "@/lib/api/services";
import { formatCurrency, formatDate, isOverdue, daysUntil } from "@/lib/format";
import type { Borrow } from "@/lib/types";

export default function BorrowsPage() {
  const queryClient = useQueryClient();
  const [issueOpen, setIssueOpen] = React.useState(false);
  const [returnTarget, setReturnTarget] = React.useState<Borrow | null>(null);
  const [renewTarget, setRenewTarget] = React.useState<Borrow | null>(null);

  const returnMutation = useMutation({
    mutationFn: (id: string) => borrowsApi.returnBook(id),
    onSuccess: (borrow) => {
      queryClient.invalidateQueries({ queryKey: ["borrows"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      const msg =
        borrow.fine > 0
          ? `Returned. Fine of ${formatCurrency(borrow.fine)} has been applied.`
          : "Book returned successfully — no fine.";
      toast.success("Book returned", { description: msg });
      setReturnTarget(null);
    },
    onError: (error) =>
      toast.error("Return failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => borrowsApi.renew(id),
    onSuccess: (borrow) => {
      queryClient.invalidateQueries({ queryKey: ["borrows"] });
      toast.success("Renewed!", {
        description: `Due date extended to ${formatDate(borrow.dueAt)}. (${2 - borrow.renewCount} renewal${2 - borrow.renewCount === 1 ? "" : "s"} left)`,
      });
      setRenewTarget(null);
    },
    onError: (error) =>
      toast.error("Renewal failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const columns = React.useMemo<ColumnDef<Borrow, unknown>[]>(
    () => [
      {
        accessorKey: "bookTitle",
        header: "Book",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/books/${row.original.bookId}`}
              className="block max-w-48 truncate font-medium hover:text-primary hover:underline"
            >
              {row.original.bookTitle}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "memberName",
        header: "Member",
        cell: ({ row }) => (
          <Link
            href={`/members/${row.original.memberId}`}
            className="hover:text-primary hover:underline"
          >
            {row.original.memberName}
          </Link>
        ),
      },
      {
        accessorKey: "issuedAt",
        header: "Issued",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(row.original.issuedAt)}
          </span>
        ),
      },
      {
        accessorKey: "dueAt",
        header: "Due",
        cell: ({ row }) => {
          const borrow = row.original;
          if (borrow.returnedAt) return <span className="text-muted-foreground">—</span>;
          const overdue = isOverdue(borrow.dueAt);
          const days = daysUntil(borrow.dueAt);
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-medium ${overdue ? "text-destructive" : Math.abs(days) <= 3 ? "text-warning" : "text-foreground"}`}
              >
                {formatDate(borrow.dueAt)}
              </span>
              {overdue ? (
                <Badge variant="destructive" className="text-xs">
                  {Math.abs(days)}d overdue
                </Badge>
              ) : days <= 3 ? (
                <Badge variant="outline" className="text-xs text-warning border-warning/50">
                  {days}d left
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <StatusBadge status={row.original.status} />
            {row.original.renewCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                ×{row.original.renewCount} renewed
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "fine",
        header: "Fine",
        cell: ({ row }) =>
          row.original.fine > 0 ? (
            <span className="font-semibold tabular-nums text-destructive">
              {formatCurrency(row.original.fine)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const borrow = row.original;
          const isActive = !borrow.returnedAt;
          if (!isActive) return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onSelect={() => setReturnTarget(borrow)}>
                  <Undo2 aria-hidden /> Return book
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setRenewTarget(borrow)}
                  disabled={borrow.renewCount >= 2}
                >
                  <RefreshCw aria-hidden /> Renew
                  {borrow.renewCount >= 2 ? " (limit reached)" : ""}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Borrows"
        description="Track all book loans, returns, renewals, and fines."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/borrows/fines">
                <DollarSign data-icon="inline-start" />
                Fines
              </Link>
            </Button>
            <Button onClick={() => setIssueOpen(true)}>
              <ArrowLeftRight data-icon="inline-start" />
              Issue Book
            </Button>
          </div>
        }
      />

      <DataTable<Borrow>
        queryKey={["borrows"]}
        queryFn={borrowsApi.list}
        columns={columns}
        searchPlaceholder="Search book title, member name…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Borrowed", value: "borrowed" },
              { label: "Returned", value: "returned" },
              { label: "Overdue", value: "overdue" },
              { label: "Renewed", value: "renewed" },
            ],
          },
        ]}
        emptyTitle="No borrow records"
        emptyDescription="Issue a book to a member to create your first record."
        emptyIcon={BookCopy}
        getRowId={(b) => b.id}
        initialSort={{ id: "issuedAt", desc: true }}
      />

      <IssueBorrowDialog open={issueOpen} onOpenChange={setIssueOpen} />

      <ConfirmDialog
        open={Boolean(returnTarget)}
        onOpenChange={(open) => !open && setReturnTarget(null)}
        title="Return this book?"
        description={`Return "${returnTarget?.bookTitle}" for ${returnTarget?.memberName}. Any late fines will be calculated automatically.`}
        confirmLabel="Confirm Return"
        isPending={returnMutation.isPending}
        onConfirm={() => returnTarget && returnMutation.mutate(returnTarget.id)}
      />

      <ConfirmDialog
        open={Boolean(renewTarget)}
        onOpenChange={(open) => !open && setRenewTarget(null)}
        title="Renew this borrow?"
        description={`Renew "${renewTarget?.bookTitle}" for 14 more days. ${renewTarget ? `(${2 - renewTarget.renewCount} renewal${2 - renewTarget.renewCount === 1 ? "" : "s"} remaining)` : ""}`}
        confirmLabel="Renew"
        isPending={renewMutation.isPending}
        onConfirm={() => renewTarget && renewMutation.mutate(renewTarget.id)}
      />
    </div>
  );
}
