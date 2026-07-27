"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { borrowsApi } from "@/lib/api/services";
import type { Borrow } from "@/lib/types";

const schema = z.object({
  dueAt: z.string().min(1, "Please set a due date"),
  status: z.enum(["borrowed", "returned", "overdue", "renewed"]),
});

type Values = z.infer<typeof schema>;

interface EditBorrowDialogProps {
  borrow: Borrow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBorrowDialog({ borrow, open, onOpenChange }: EditBorrowDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      dueAt: borrow?.dueAt ? new Date(borrow.dueAt).toISOString().split("T")[0] : "",
      status: borrow?.status ?? "borrowed",
    },
  });

  React.useEffect(() => {
    if (borrow) {
      form.reset({
        dueAt: new Date(borrow.dueAt).toISOString().split("T")[0],
        status: borrow.status,
      });
    }
  }, [borrow, form]);

  const editMutation = useMutation({
    mutationFn: (v: Values) =>
      borrow && borrowsApi.update(borrow.id, {
        dueAt: new Date(v.dueAt).toISOString(),
        status: v.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrows"] });
      toast.success("Borrow updated successfully!");
      onOpenChange(false);
    },
    onError: (error) =>
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const isBusy = editMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !isBusy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Borrow</DialogTitle>
          <DialogDescription>
            Update the due date and status for this borrow record.
          </DialogDescription>
        </DialogHeader>

        {borrow && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{borrow.bookTitle}</p>
            <p className="text-muted-foreground">{borrow.memberName}</p>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => editMutation.mutate(v))}
            className="space-y-4"
            noValidate
          >
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="borrowed">Borrowed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="renewed">Renewed</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
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
                {isBusy ? "Updating…" : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
