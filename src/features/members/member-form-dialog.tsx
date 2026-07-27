"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookCopy, CalendarDays, DollarSign, Loader2, RefreshCw, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { membersApi, type MemberInput } from "@/lib/api/services";
import { formatCurrency } from "@/lib/format";
import type { Member, MembershipPlan, PlanConstraints } from "@/lib/types";

const memberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(6, "Enter a valid phone number"),
  address: z.string().min(5, "Enter a valid address"),
  plan: z.enum(["standard", "premium", "student"]),
  status: z.enum(["active", "suspended", "expired"]),
  expiresAt: z.string().min(1, "Expiry date is required"),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Member | null;
}

function PlanBenefitsCard({ plan, constraints }: { plan: MembershipPlan; constraints: PlanConstraints | undefined }) {
  if (!constraints) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium capitalize">{plan} Plan Benefits</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <BookCopy className="h-3 w-3 text-muted-foreground" />
          <span>Max {constraints.maxBorrows} books</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3 text-muted-foreground" />
          <span>{constraints.borrowDurationDays} days/borrow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3 text-muted-foreground" />
          <span>{constraints.maxRenewals} renewals</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span>{formatCurrency(constraints.finePerDay)}/day fine</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t text-xs">
        <span className="text-muted-foreground">Membership fee</span>
        <Badge variant="secondary" className="font-mono">
          {formatCurrency(constraints.membershipFee)}
        </Badge>
      </div>
    </div>
  );
}

export function MemberFormDialog({ open, onOpenChange, editing }: MemberFormDialogProps) {
  const queryClient = useQueryClient();

  const { data: planConstraints } = useQuery({
    queryKey: ["plan-constraints"],
    queryFn: membersApi.getPlanConstraints,
    staleTime: 5 * 60_000,
  });

  const defaultExpiry = new Date(Date.now() + 365 * 86_400_000).toISOString().split("T")[0];

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      plan: "standard",
      status: "active",
      expiresAt: defaultExpiry,
    },
  });

  const selectedPlan = form.watch("plan") as MembershipPlan;
  const currentConstraints = planConstraints?.[selectedPlan];

  React.useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        address: editing.address,
        plan: editing.plan,
        status: editing.status,
        expiresAt: editing.expiresAt.split("T")[0],
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        plan: "standard",
        status: "active",
        expiresAt: defaultExpiry,
      });
    }
  }, [editing, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: (values: MemberFormValues) => {
      const input: MemberInput = {
        ...values,
        expiresAt: new Date(values.expiresAt).toISOString(),
      };
      return editing ? membersApi.update(editing.id, input) : membersApi.create(input);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success(editing ? "Member updated" : "Member created", {
        description: `${saved.name} has been ${editing ? "updated" : "added"} successfully.`,
      });
      onOpenChange(false);
    },
    onError: (error) =>
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const isBusy = saveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !isBusy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Member" : "Add New Member"}</DialogTitle>
          <DialogDescription>
            {editing
              ? `Update details for ${editing.name}.`
              : "Register a new library member."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" disabled={isBusy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" disabled={isBusy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 000 0000" disabled={isBusy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, State" disabled={isBusy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membership plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isBusy}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="premium">
                          Premium {planConstraints && `(${formatCurrency(planConstraints.premium.membershipFee)})`}
                        </SelectItem>
                        <SelectItem value="standard">
                          Standard {planConstraints && `(${formatCurrency(planConstraints.standard.membershipFee)})`}
                        </SelectItem>
                        <SelectItem value="student">
                          Student {planConstraints && `(${formatCurrency(planConstraints.student.membershipFee)})`}
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="sm:col-span-2">
                <PlanBenefitsCard plan={selectedPlan} constraints={currentConstraints} />
              </div>

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Membership expires</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isBusy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" disabled={isBusy} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isBusy ? "Saving…" : editing ? "Save changes" : "Add member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
