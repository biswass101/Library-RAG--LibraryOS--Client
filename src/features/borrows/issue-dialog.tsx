"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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

export function IssueBorrowDialog({ open, onOpenChange }: IssueBorrowDialogProps) {
  const queryClient = useQueryClient();

  const defaultDue = new Date(Date.now() + 14 * 86_400_000).toISOString().split("T")[0];

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { bookId: "", memberId: "", dueAt: defaultDue },
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
      form.reset({ bookId: "", memberId: "", dueAt: defaultDue });
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
                          <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
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
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date</FormLabel>
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
              <Button type="submit" disabled={isBusy}>
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
