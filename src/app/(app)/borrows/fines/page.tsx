"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, DollarSign, MoreHorizontal, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

export default function FinesPage() {
  const queryClient = useQueryClient();

  const settleMutation = useMutation({
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Fine actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onSelect={() => settleMutation.mutate({ id: fine.id, mode: "paid" })}
                >
                  <CheckCircle2 aria-hidden /> Mark as paid
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => settleMutation.mutate({ id: fine.id, mode: "waived" })}
                >
                  <XCircle aria-hidden /> Waive fine
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        emptyIcon={DollarSign}
        getRowId={(f) => f.id}
        initialSort={{ id: "createdAt", desc: true }}
      />
    </div>
  );
}
