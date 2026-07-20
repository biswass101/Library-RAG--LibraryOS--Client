"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2, UserPlus, Eye, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { MemberFormDialog } from "@/features/members/member-form-dialog";
import { membersApi } from "@/lib/api/services";
import { formatCurrency, initials } from "@/lib/format";
import type { Member } from "@/lib/types";

const PLAN_COLORS: Record<string, string> = {
  premium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  student: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  standard: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function MembersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Member | null>(null);

  const deleteMutation = useMutation({
    mutationFn: membersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member removed", {
        description: `${deleteTarget?.name} has been deleted.`,
      });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Delete failed", { description: "Please try again." }),
  });

  const openEdit = (member: Member) => {
    setEditing(member);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const columns = React.useMemo<ColumnDef<Member, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Member",
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials(m.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="max-w-40 truncate font-medium">{m.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="max-w-36 truncate">{m.email}</span>
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {row.original.phone}
          </span>
        ),
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => (
          <Badge className={`capitalize ${PLAN_COLORS[row.original.plan]}`} variant="secondary">
            {row.original.plan}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "activeBorrows",
        header: "Active borrows",
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">{row.original.activeBorrows}</span>
        ),
      },
      {
        accessorKey: "outstandingFines",
        header: "Outstanding fines",
        cell: ({ row }) =>
          row.original.outstandingFines > 0 ? (
            <span className="font-medium tabular-nums text-destructive">
              {formatCurrency(row.original.outstandingFines)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${row.original.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem asChild>
                <Link href={`/members/${row.original.id}`}>
                  <Eye aria-hidden /> View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openEdit(row.original)}>
                <Pencil aria-hidden /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteTarget(row.original)}
              >
                <Trash2 aria-hidden /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Members"
        description="Manage library members, memberships, and borrowing records."
        actions={
          <Button onClick={openCreate}>
            <UserPlus data-icon="inline-start" />
            Add Member
          </Button>
        }
      />

      <DataTable<Member>
        queryKey={["members"]}
        queryFn={membersApi.list}
        columns={columns}
        searchPlaceholder="Search name, email, phone…"
        filters={[
          {
            key: "plan",
            label: "Plan",
            options: [
              { label: "Standard", value: "standard" },
              { label: "Premium", value: "premium" },
              { label: "Student", value: "student" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Suspended", value: "suspended" },
              { label: "Expired", value: "expired" },
            ],
          },
        ]}
        emptyTitle="No members found"
        emptyDescription="Add your first member to get started."
        onRowClick={(member) => router.push(`/members/${member.id}`)}
        getRowId={(m) => m.id}
        initialSort={{ id: "name", desc: false }}
      />

      <MemberFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove this member?"
        description={`${deleteTarget?.name} will be permanently deleted along with their borrow history.`}
        confirmLabel="Delete"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
