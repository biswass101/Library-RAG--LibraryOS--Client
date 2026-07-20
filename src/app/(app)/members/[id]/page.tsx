"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BookCopy,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { MemberFormDialog } from "@/features/members/member-form-dialog";
import { membersApi } from "@/lib/api/services";
import { formatCurrency, formatDate, formatRelative, initials } from "@/lib/format";
import type { Member } from "@/lib/types";

const PLAN_COLORS: Record<string, string> = {
  premium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  student: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  standard: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3 text-center ${className}`}>
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const { data: member, isPending, isError, refetch } = useQuery({
    queryKey: ["members", id],
    queryFn: () => membersApi.get(id),
  });

  const borrowHistory = useQuery({
    queryKey: ["members", id, "borrows"],
    queryFn: () => membersApi.borrowHistory(id),
    enabled: !!member,
  });

  const fineHistory = useQuery({
    queryKey: ["members", id, "fines"],
    queryFn: () => membersApi.fineHistory(id),
    enabled: !!member,
  });

  const deleteMutation = useMutation({
    mutationFn: () => membersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member deleted");
      router.push("/members");
    },
    onError: () => toast.error("Delete failed"),
  });

  if (isPending) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorState onRetry={() => refetch()} message="This member could not be loaded." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/members">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={member.name}
          description={`Member since ${formatDate(member.joinedAt)}`}
          actions={
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil data-icon="inline-start" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full">
            <CardContent className="flex flex-col items-center gap-5 pt-8">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-lg font-semibold">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <StatusBadge status={member.status} />
                  <Badge className={`capitalize ${PLAN_COLORS[member.plan]}`} variant="secondary">
                    {member.plan}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="grid w-full grid-cols-3 gap-2">
                <StatCard icon={BookCopy} label="Active" value={member.activeBorrows} />
                <StatCard icon={History} label="Total" value={member.totalBorrows} />
                <StatCard
                  icon={DollarSign}
                  label="Fines"
                  value={formatCurrency(member.outstandingFines)}
                  className={member.outstandingFines > 0 ? "!text-destructive" : ""}
                />
              </div>
              <Separator />
              <div className="w-full space-y-3">
                <MetaItem icon={Mail} label="Email" value={member.email} />
                <MetaItem icon={Phone} label="Phone" value={member.phone} />
                <MetaItem icon={MapPin} label="Address" value={member.address} />
                <MetaItem icon={CreditCard} label="Plan" value={<span className="capitalize">{member.plan}</span>} />
                <MetaItem icon={Calendar} label="Expires" value={formatDate(member.expiresAt)} />
                <MetaItem icon={User} label="Joined" value={formatDate(member.joinedAt)} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* History tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <Tabs defaultValue="borrows">
              <CardHeader>
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="borrows" className="flex-1 sm:flex-none">
                    <BookCopy className="mr-1.5 h-3.5 w-3.5" />
                    Borrow History
                  </TabsTrigger>
                  <TabsTrigger value="fines" className="flex-1 sm:flex-none">
                    <DollarSign className="mr-1.5 h-3.5 w-3.5" />
                    Fines
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="borrows" className="mt-0">
                  {borrowHistory.isPending ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : borrowHistory.isError ? (
                    <ErrorState className="py-6" onRetry={() => borrowHistory.refetch()} />
                  ) : !borrowHistory.data?.length ? (
                    <EmptyState
                      icon={History}
                      title="No borrow history"
                      description="This member hasn't borrowed any books yet."
                      className="py-8"
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Issued</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Fine</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {borrowHistory.data.map((b) => (
                            <TableRow key={b.id}>
                              <TableCell className="font-medium">
                                <Link
                                  href={`/books/${b.bookId}`}
                                  className="hover:text-primary hover:underline max-w-40 truncate block"
                                >
                                  {b.bookTitle}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(b.issuedAt)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(b.dueAt)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={b.status} />
                              </TableCell>
                              <TableCell>
                                {b.fine > 0 ? (
                                  <span className="font-medium text-destructive">
                                    {formatCurrency(b.fine)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="fines" className="mt-0">
                  {fineHistory.isPending ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : fineHistory.isError ? (
                    <ErrorState className="py-6" onRetry={() => fineHistory.refetch()} />
                  ) : !fineHistory.data?.length ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="No fines"
                      description="This member has no outstanding or past fines."
                      className="py-8"
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fineHistory.data.map((f) => (
                            <TableRow key={f.id}>
                              <TableCell className="font-medium max-w-40 truncate">
                                {f.bookTitle}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {f.reason}
                              </TableCell>
                              <TableCell className="font-semibold tabular-nums">
                                {formatCurrency(f.amount)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={f.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>

      <MemberFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={member}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this member?"
        description={`${member.name}'s account and all associated data will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
