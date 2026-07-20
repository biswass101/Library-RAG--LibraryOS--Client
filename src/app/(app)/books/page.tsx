"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { BookPlus, Eye, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { selectionColumn } from "@/components/data-table/selection-column";
import { useQuery } from "@tanstack/react-query";
import { booksApi, categoriesApi } from "@/lib/api/services";
import type { Book } from "@/lib/types";

export default function BooksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = React.useState<Book | null>(null);

  const { data: allCategories } = useQuery({ queryKey: ["categories", "all"], queryFn: categoriesApi.all });

  const deleteMutation = useMutation({
    mutationFn: booksApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book deleted", { description: `"${deleteTarget?.title}" was removed from the catalog.` });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Delete failed", { description: "Please try again." }),
  });

  const columns = React.useMemo<ColumnDef<Book, unknown>[]>(
    () => [
      selectionColumn<Book>(),
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-7 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: row.original.coverColor }}
            >
              {row.original.title.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="max-w-56 truncate font-medium">{row.original.title}</p>
              <p className="text-xs text-muted-foreground">{row.original.authorName}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "isbn", header: "ISBN", cell: ({ row }) => <span className="font-mono text-xs">{row.original.isbn}</span> },
      { accessorKey: "categoryName", header: "Category" },
      {
        accessorKey: "availableCopies",
        header: "Copies",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.availableCopies}
            <span className="text-muted-foreground"> / {row.original.totalCopies}</span>
          </span>
        ),
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Star className="size-3.5 fill-warning text-warning" aria-hidden />
            {row.original.rating.toFixed(1)}
          </span>
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
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.original.title}`} onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem asChild>
                <Link href={`/books/${row.original.id}`}>
                  <Eye aria-hidden /> View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/books/${row.original.id}/edit`}>
                  <Pencil aria-hidden /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(row.original)}>
                <Trash2 aria-hidden /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Books"
        description="Browse, search and manage the entire catalog."
        actions={
          <Button asChild>
            <Link href="/books/new">
              <BookPlus data-icon="inline-start" />
              Add Book
            </Link>
          </Button>
        }
      />

      <DataTable<Book>
        queryKey={["books"]}
        queryFn={booksApi.list}
        columns={columns}
        searchPlaceholder="Search title, ISBN, author…"
        filters={[
          {
            key: "categoryId",
            label: "Categories",
            options: (allCategories ?? []).map((c) => ({ label: c.name, value: c.id })),
          },
          {
            key: "status",
            label: "Statuses",
            options: [
              { label: "Available", value: "available" },
              { label: "Low stock", value: "low-stock" },
              { label: "Out of stock", value: "out-of-stock" },
            ],
          },
        ]}
        emptyTitle="No books found"
        emptyDescription="Try adjusting your search, or add a new book to the catalog."
        onRowClick={(book) => router.push(`/books/${book.id}`)}
        getRowId={(book) => book.id}
        initialSort={{ id: "title", desc: false }}
        renderSelectionActions={(rows, clear) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              await Promise.all(rows.map((r) => booksApi.remove(r.id)));
              queryClient.invalidateQueries({ queryKey: ["books"] });
              toast.success(`${rows.length} book${rows.length > 1 ? "s" : ""} deleted`);
              clear();
            }}
          >
            <Trash2 data-icon="inline-start" />
            Delete selected
          </Button>
        )}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this book?"
        description={`"${deleteTarget?.title}" and its copies will be permanently removed from the catalog. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
