"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, CheckCircle2, Loader2, MoreHorizontal, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { booksApi, membersApi, reservationsApi } from "@/lib/api/services";
import { formatDate, formatRelative } from "@/lib/format";
import type { Reservation } from "@/lib/types";

const schema = z.object({
  bookId: z.string().min(1, "Please select a book"),
  memberId: z.string().min(1, "Please select a member"),
});

type Values = z.infer<typeof schema>;

function CreateReservationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { bookId: "", memberId: "" },
  });

  const { data: books } = useQuery({
    queryKey: ["books", "all-for-res"],
    queryFn: () => booksApi.list({ pageSize: 200 }),
    enabled: open,
  });

  const { data: members } = useQuery({
    queryKey: ["members", "all-for-res"],
    queryFn: () => membersApi.all(),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (v: Values) => reservationsApi.create(v),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Reservation created", {
        description: `"${res.bookTitle}" reserved for ${res.memberName} (queue #${res.queuePosition}).`,
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) =>
      toast.error("Failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const isBusy = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !isBusy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Reservation</DialogTitle>
          <DialogDescription>
            Reserve a book for a member. They&apos;ll be notified when it becomes available.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => createMutation.mutate(v))}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="bookId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a book…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {books?.items.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members?.filter((m) => m.status === "active").map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isBusy} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isBusy ? "Creating…" : "Create reservation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = React.useState(false);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Reservation["status"] }) =>
      reservationsApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success(`Reservation ${status}`);
    },
    onError: () => toast.error("Action failed"),
  });

  const columns = React.useMemo<ColumnDef<Reservation, unknown>[]>(
    () => [
      {
        accessorKey: "bookTitle",
        header: "Book",
        cell: ({ row }) => (
          <Link
            href={`/books/${row.original.bookId}`}
            className="max-w-44 truncate block font-medium hover:text-primary hover:underline"
          >
            {row.original.bookTitle}
          </Link>
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
        accessorKey: "reservedAt",
        header: "Reserved",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelative(row.original.reservedAt)}
          </span>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.expiresAt)}</span>
        ),
      },
      {
        accessorKey: "queuePosition",
        header: "Queue",
        cell: ({ row }) =>
          row.original.queuePosition > 0 ? (
            <Badge variant="secondary">#{row.original.queuePosition}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const res = row.original;
          const isActive = res.status === "pending" || res.status === "ready";
          if (!isActive) return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Reservation actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onSelect={() => statusMutation.mutate({ id: res.id, status: "ready" })}
                  disabled={res.status === "ready"}
                >
                  <CheckCircle2 aria-hidden /> Mark as ready
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => statusMutation.mutate({ id: res.id, status: "fulfilled" })}
                >
                  <CheckCircle2 aria-hidden /> Mark fulfilled
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => statusMutation.mutate({ id: res.id, status: "cancelled" })}
                >
                  <XCircle aria-hidden /> Cancel
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
        title="Reservations"
        description="Track hold requests for books that are currently unavailable."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            New Reservation
          </Button>
        }
      />

      <DataTable<Reservation>
        queryKey={["reservations"]}
        queryFn={reservationsApi.list}
        columns={columns}
        searchPlaceholder="Search book, member…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Ready", value: "ready" },
              { label: "Fulfilled", value: "fulfilled" },
              { label: "Cancelled", value: "cancelled" },
              { label: "Expired", value: "expired" },
            ],
          },
        ]}
        emptyTitle="No reservations"
        emptyDescription="Create a reservation to hold a book for a member."
        emptyIcon={CalendarClock}
        getRowId={(r) => r.id}
        initialSort={{ id: "reservedAt", desc: true }}
      />

      <CreateReservationDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
