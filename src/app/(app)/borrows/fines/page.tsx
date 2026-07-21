"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  DollarSign,
  MoreHorizontal,
  Receipt,
  User2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { finesApi } from "@/lib/api/services";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Fine } from "@/lib/types";

/* ─── Pay Fine Dialog ──────────────────────────────────────────────────── */

function PayFineDialog({
  fine,
  open,
  onOpenChange,
}: {
  fine: Fine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const settleMutation = useMutation({
    mutationFn: ({ mode }: { mode: "paid" | "waived" }) =>
      finesApi.settle(fine!.id, mode),
    onSuccess: (_, { mode }) => {
      queryClient.invalidateQueries({ queryKey: ["fines"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success(mode === "paid" ? "Fine paid successfully!" : "Fine waived", {
        description:
          mode === "paid"
            ? `${formatCurrency(fine!.amount)} payment recorded for ${fine!.memberName}.`
            : `Fine of ${formatCurrency(fine!.amount)} has been waived for ${fine!.memberName}.`,
      });
      onOpenChange(false);
    },
    onError: () =>
      toast.error("Action failed", { description: "Please try again." }),
  });

  if (!fine) return null;

  const isBusy = settleMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Pay Library Fine
          </DialogTitle>
          <DialogDescription>
            Review the fine details below before confirming payment.
          </DialogDescription>
        </DialogHeader>

        {/* Fine Details Card */}
        <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
          {/* Amount highlight */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Amount Due</span>
            <span className="text-2xl font-bold text-destructive tabular-nums">
              {formatCurrency(fine.amount)}
            </span>
          </div>
          <div className="h-px bg-border" />

          {/* Member */}
          <div className="flex items-center gap-2.5 text-sm">
            <User2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Member:</span>
            <Link
              href={`/members/${fine.memberId}`}
              className="font-medium hover:underline"
              onClick={() => onOpenChange(false)}
            >
              {fine.memberName}
            </Link>
          </div>

          {/* Book */}
          {fine.bookTitle && (
            <div className="flex items-center gap-2.5 text-sm">
              <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Book:</span>
              <span className="font-medium">{fine.bookTitle}</span>
            </div>
          )}

          {/* Reason */}
          <div className="flex items-start gap-2.5 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">Reason:</span>
            <span className="font-medium">{fine.reason}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-muted-foreground pl-6">Issued:</span>
            <span className="font-medium">{formatDate(fine.createdAt)}</span>
          </div>
        </div>

        {/* Warning note */}
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          This action is irreversible. Once paid the fine status cannot be changed.
        </p>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={isBusy}
            onClick={() => settleMutation.mutate({ mode: "waived" })}
          >
            <XCircle className="h-4 w-4" />
            Waive Fine
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={isBusy}
            onClick={() => settleMutation.mutate({ mode: "paid" })}
          >
            {isBusy ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4" />
                Confirm Payment · {formatCurrency(fine.amount)}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Fines Page ─────────────────────────────────────────────────────────── */

export default function FinesPage() {
  const queryClient = useQueryClient();
  const [payFine, setPayFine] = React.useState<Fine | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const openPayDialog = (fine: Fine) => {
    setPayFine(fine);
    setDialogOpen(true);
  };

  // Quick settle without dialog (for dropdown waive action)
  const quickSettleMutation = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: "paid" | "waived" }) =>
      finesApi.settle(id, mode),
    onSuccess: (fine, { mode }) => {
      queryClient.invalidateQueries({ queryKey: ["fines"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success(mode === "paid" ? "Fine marked as paid" : "Fine waived", {
        description: `${formatCurrency(fine.amount)} for ${fine.memberName}.`,
      });
    },
    onError: () => toast.error("Action failed", { description: "Please try again." }),
  });

  const columns = React.useMemo<ColumnDef<Fine, unknown>[]>(
    () => [
      {
        accessorKey: "memberName",
        header: "Member",
        cell: ({ row }) => (
          <Link
            href={`/members/${row.original.memberId}`}
            className="font-medium hover:text-primary hover:underline"
          >
            {row.original.memberName}
          </Link>
        ),
      },
      {
        accessorKey: "bookTitle",
        header: "Book",
        cell: ({ row }) => (
          <span className="max-w-48 truncate block text-sm">{row.original.bookTitle}</span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.reason}</span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const fine = row.original;
          if (fine.status !== "unpaid") return null;
          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {/* Primary: Pay button */}
              <Button
                id={`pay-fine-${fine.id}`}
                size="sm"
                className="h-7 gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs"
                onClick={() => openPayDialog(fine)}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Pay
              </Button>

              {/* Secondary: overflow actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More fine actions"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => openPayDialog(fine)}
                  >
                    <CheckCircle2 aria-hidden /> Mark as paid
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => quickSettleMutation.mutate({ id: fine.id, mode: "waived" })}
                  >
                    <XCircle aria-hidden /> Waive fine
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Fines"
        description="View and settle outstanding library fines."
      />

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="gap-1.5 py-1 px-3">
          <DollarSign className="h-3.5 w-3.5 text-destructive" />
          Outstanding fines require payment
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1 px-3">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          Click <strong>Pay</strong> on any unpaid fine to settle
        </Badge>
      </div>

      <DataTable<Fine>
        queryKey={["fines"]}
        queryFn={finesApi.list}
        columns={columns}
        searchPlaceholder="Search member name, book…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Unpaid", value: "unpaid" },
              { label: "Paid", value: "paid" },
              { label: "Waived", value: "waived" },
            ],
          },
        ]}
        emptyTitle="No fines found"
        emptyDescription="All members are up to date — no outstanding fines."
        getRowId={(f) => f.id}
        initialSort={{ id: "createdAt", desc: true }}
      />

      {/* Pay / Waive dialog */}
      <PayFineDialog
        fine={payFine}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
