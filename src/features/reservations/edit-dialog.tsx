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
import { reservationsApi } from "@/lib/api/services";
import type { Reservation } from "@/lib/types";

const schema = z.object({
  expiresAt: z.string().min(1, "Please set an expiration date"),
  queuePosition: z.coerce.number().min(1, "Queue position must be at least 1"),
});

type Values = z.infer<typeof schema>;

interface EditReservationDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditReservationDialog({
  reservation,
  open,
  onOpenChange,
}: EditReservationDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      expiresAt: reservation?.expiresAt
        ? new Date(reservation.expiresAt).toISOString().split("T")[0]
        : "",
      queuePosition: reservation?.queuePosition ?? 1,
    },
  });

  React.useEffect(() => {
    if (reservation) {
      form.reset({
        expiresAt: new Date(reservation.expiresAt).toISOString().split("T")[0],
        queuePosition: reservation.queuePosition,
      });
    }
  }, [reservation, form]);

  const editMutation = useMutation({
    mutationFn: (v: Values) =>
      reservation &&
      reservationsApi.update(reservation.id, {
        expiresAt: new Date(v.expiresAt).toISOString(),
        queuePosition: v.queuePosition,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Reservation updated successfully!");
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
          <DialogTitle>Edit Reservation</DialogTitle>
          <DialogDescription>
            Update the expiration date and queue position for this reservation.
          </DialogDescription>
        </DialogHeader>

        {reservation && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{reservation.bookTitle}</p>
            <p className="text-muted-foreground">{reservation.memberName}</p>
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
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration date</FormLabel>
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
              name="queuePosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Queue position</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      disabled={isBusy}
                      {...field}
                    />
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
                {isBusy ? "Updating…" : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
