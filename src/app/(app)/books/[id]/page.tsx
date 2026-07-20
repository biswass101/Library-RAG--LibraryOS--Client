"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookCopy,
  Building2,
  CalendarDays,
  Globe2,
  Hash,
  History,
  MapPin,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { booksApi } from "@/lib/api/services";
import { formatDate, formatNumber } from "@/lib/format";

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function BookDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const { data: book, isPending, isError, refetch } = useQuery({
    queryKey: ["books", id],
    queryFn: () => booksApi.get(id),
  });

  const history = useQuery({
    queryKey: ["books", id, "history"],
    queryFn: () => booksApi.borrowHistory(id),
    enabled: Boolean(book),
  });

  const deleteMutation = useMutation({
    mutationFn: () => booksApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book deleted", { description: `"${book?.title}" was removed.` });
      router.push("/books");
    },
    onError: () => toast.error("Delete failed", { description: "Please try again." }),
  });

  if (isPending) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-1" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorState onRetry={() => refetch()} message="This book could not be loaded. It may have been deleted." />
      </div>
    );
  }

  const utilization = book.totalCopies > 0 ? Math.round(((book.totalCopies - book.availableCopies) / book.totalCopies) * 100) : 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title={book.title}
        description={`by ${book.authorName}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/books/${book.id}/edit`}>
                <Pencil data-icon="inline-start" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cover + quick stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center gap-5 pt-6">
              <div
                aria-hidden
                className="flex h-52 w-36 items-end justify-start rounded-lg p-3 shadow-lg"
                style={{
                  background: `linear-gradient(145deg, ${book.coverColor}, color-mix(in oklch, ${book.coverColor}, black 30%))`,
                }}
              >
                <p className="line-clamp-4 text-sm font-bold leading-snug text-white">{book.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={book.status} />
                <span className="inline-flex items-center gap-1 text-sm font-medium">
                  <Star className="size-4 fill-warning text-warning" aria-hidden />
                  {book.rating.toFixed(1)}
                </span>
              </div>
              <Separator />
              <div className="grid w-full grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold tabular-nums">{book.availableCopies}</p>
                  <p className="text-[11px] text-muted-foreground">Available</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums">{book.totalCopies}</p>
                  <p className="text-[11px] text-muted-foreground">Total copies</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums">{formatNumber(book.borrowCount)}</p>
                  <p className="text-[11px] text-muted-foreground">All-time loans</p>
                </div>
              </div>
              <div className="w-full rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
                {utilization}% of copies currently in circulation
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">About this book</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{book.description}</p>
              <Separator />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <MetaItem icon={Hash} label="ISBN" value={<span className="font-mono">{book.isbn}</span>} />
                <MetaItem icon={BookCopy} label="Category" value={book.categoryName} />
                <MetaItem icon={Building2} label="Publisher" value={book.publisherName} />
                <MetaItem icon={CalendarDays} label="Published" value={book.publishedYear} />
                <MetaItem icon={Globe2} label="Language" value={book.language} />
                <MetaItem icon={MapPin} label="Shelf location" value={book.shelfLocation} />
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Added to catalog on {formatDate(book.createdAt)} · {book.pages} pages
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Borrow history */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Borrow history</CardTitle>
          </CardHeader>
          <CardContent>
            {history.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : history.isError ? (
              <ErrorState className="py-6" onRetry={() => history.refetch()} />
            ) : !history.data?.length ? (
              <EmptyState icon={History} title="No borrow history" description="This book hasn't been borrowed yet." className="py-8" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Returned</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.data.slice(0, 8).map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">
                          <Link href={`/members/${b.memberId}`} className="hover:text-primary hover:underline">
                            {b.memberName}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(b.issuedAt)}</TableCell>
                        <TableCell>{formatDate(b.dueAt)}</TableCell>
                        <TableCell>{b.returnedAt ? formatDate(b.returnedAt) : "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this book?"
        description={`"${book.title}" and its copies will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
