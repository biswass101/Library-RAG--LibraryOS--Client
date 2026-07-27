"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarDays, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { booksApi, membersApi, borrowsApi } from "@/lib/api/services";
import type { AllPlanConstraints, Member } from "@/lib/types";

const schema = z.object({
  bookId: z.string().min(1, "Please select a book"),
  memberId: z.string().min(1, "Please select a member"),
  dueAt: z.string().min(1, "Please set a due date"),
});

type Values = z.infer<typeof schema>;

interface IssueBorrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getBorrowLimitInfo(member: Member | undefined, constraints: AllPlanConstraints | undefined) {
  if (!member || !constraints) return null;
  const plan = constraints[member.plan];
  if (!plan) return null;
  const remaining = plan.maxBorrows - member.activeBorrows;
  return { max: plan.maxBorrows, active: member.activeBorrows, remaining, atLimit: remaining <= 0 };
}

export function IssueBorrowDialog({ open, onOpenChange }: IssueBorrowDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { bookId: "", memberId: "", dueAt: "" },
  });

  const { data: books } = useQuery({
    queryKey: ["books", "all-for-issue"],
    queryFn: () => booksApi.list({ pageSize: 200 }),
    enabled: open,
  });

  const { data: members } = useQuery({
    queryKey: ["members", "all-for-issue"],
    queryFn: () => membersApi.all(),
    enabled: open,
  });

  const { data: planConstraints } = useQuery({
    queryKey: ["plan-constraints"],
    queryFn: membersApi.getPlanConstraints,
    staleTime: 5 * 60_000,
  });

  const selectedMemberId = form.watch("memberId");
  const selectedMember = members?.find((m) => m.id === selectedMemberId);
  const limitInfo = getBorrowLimitInfo(selectedMember, planConstraints);

  React.useEffect(() => {
    if (selectedMember && planConstraints) {
      const plan = planConstraints[selectedMember.plan];
      if (plan) {
        const dueDate = new Date(Date.now() + plan.borrowDurationDays * 86_400_000)
          .toISOString()
          .split("T")[0];
        form.setValue("dueAt", dueDate);
      }
    }
  }, [selectedMemberId, planConstraints]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (open) {
      form.reset({ bookId: "", memberId: "", dueAt: "" });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const issueMutation = useMutation({
    mutationFn: (v: Values) =>
      borrowsApi.issue({
        bookId: v.bookId,
        memberId: v.memberId,
        dueAt: new Date(v.dueAt).toISOString(),
      }),
    onSuccess: (borrow) => {
      queryClient.invalidateQueries({ queryKey: ["borrows"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Book issued!", {
        description: `"${borrow.bookTitle}" issued to ${borrow.memberName}.`,
      });
      form.reset({ bookId: "", memberId: "", dueAt: "" });
      onOpenChange(false);
    },
    onError: (error) =>
      toast.error("Issue failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const isBusy = issueMutation.isPending;
  const availableBooks = books?.items.filter((b) => b.availableCopies > 0) ?? [];
  const activeMembers = members?.filter((m) => m.status === "active") ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !isBusy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Book</DialogTitle>
          <DialogDescription>
            Select a book and member to issue a borrow record.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => issueMutation.mutate(v))}
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
                        <SelectValue placeholder="Select an available book…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBooks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({b.availableCopies} avail.)
                          </span>
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
                        <SelectValue placeholder="Select an active member…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {m.plan} · {m.activeBorrows} active
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {limitInfo && (
              <Alert variant={limitInfo.atLimit ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {limitInfo.atLimit ? (
                    <span>
                      <strong className="capitalize">{selectedMember?.plan}</strong> plan limit reached ({limitInfo.max}/{limitInfo.max} books).
                      Cannot issue more books.
                    </span>
                  ) : (
                    <span>
                      <strong className="capitalize">{selectedMember?.plan}</strong> plan: {limitInfo.active}/{limitInfo.max} books borrowed.
                      {" "}{limitInfo.remaining} remaining.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Due date
                    {selectedMember && planConstraints && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({planConstraints[selectedMember.plan]?.borrowDurationDays} days for {selectedMember.plan})
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="date" className="pl-9" disabled={isBusy} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isBusy || (limitInfo?.atLimit ?? false)}>
                {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isBusy ? "Issuing…" : "Issue book"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
