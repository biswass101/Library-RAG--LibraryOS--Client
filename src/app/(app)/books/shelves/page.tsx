"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Boxes, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { booksApi } from "@/lib/api/services";
import type { ShelfSlot } from "@/lib/types";

export default function BooksShelvesPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = React.useState({ code: "", label: "", capacity: "4", description: "" });
  const { data: shelfSlots = [], isPending } = useQuery({ queryKey: ["shelf-slots"], queryFn: booksApi.listShelfSlots });

  const createMutation = useMutation({
    mutationFn: booksApi.createShelfSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shelf-slots"] });
      setDraft({ code: "", label: "", capacity: "4", description: "" });
      toast.success("Shelf section added");
    },
    onError: () => toast.error("Could not add shelf section"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Parameters<typeof booksApi.updateShelfSlot>[1]> }) => booksApi.updateShelfSlot(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelf-slots"] }),
    onError: () => toast.error("Could not update shelf section"),
  });

  const deleteMutation = useMutation({
    mutationFn: booksApi.removeShelfSlot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelf-slots"] }),
    onError: () => toast.error("Could not remove shelf section"),
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Shelf management"
        description="Create realistic shelf sections, track capacity, and place books into available compartments."
        actions={
          <Button asChild variant="outline">
            <Link href="/books">
              <BookOpen data-icon="inline-start" />
              Back to books
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a new shelf section</CardTitle>
          <CardDescription>Each block represents a realistic shelf compartment with a visible capacity.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="A-01"
            value={draft.code}
            onChange={(e) => setDraft((current) => ({ ...current, code: e.target.value.toUpperCase() }))}
          />
          <Input
            placeholder="North wall"
            value={draft.label}
            onChange={(e) => setDraft((current) => ({ ...current, label: e.target.value }))}
          />
          <Input
            type="number"
            min={1}
            placeholder="4"
            value={draft.capacity}
            onChange={(e) => setDraft((current) => ({ ...current, capacity: e.target.value }))}
          />
          <Input
            placeholder="Optional note"
            value={draft.description}
            onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
          />
          <div className="md:col-span-4 flex justify-end">
            <Button
              type="button"
              onClick={() => {
                const capacity = Number(draft.capacity || 1);
                if (!draft.code.trim() || !draft.label.trim()) {
                  toast.error("Add both a section code and label");
                  return;
                }
                createMutation.mutate({
                  code: draft.code.trim(),
                  label: draft.label.trim(),
                  capacity: Number.isFinite(capacity) ? capacity : 1,
                  description: draft.description.trim() || undefined,
                });
              }}
              disabled={createMutation.isPending}
            >
              <Plus data-icon="inline-start" />
              Add section
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {(isPending ? Array.from({ length: 3 }) : shelfSlots).map((slot: ShelfSlot | undefined, index: number) => {
          const used = (slot?.books ?? []).length;
          const remaining = Math.max(0, (slot?.capacity ?? 0) - used);
          return (
            <Card key={slot?.id ?? index} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{slot?.code ?? "Loading…"}</CardTitle>
                    <CardDescription>{slot?.label ?? "Preparing shelf data…"}</CardDescription>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {remaining}/{slot?.capacity ?? 0} free
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-gradient-to-br from-muted/40 to-background p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Boxes className="size-4" />
                    <span>{slot?.description ?? "Physical shelf block for organized book placement"}</span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {Array.from({ length: Math.max(1, slot?.capacity ?? 1) }).map((_, compartmentIndex) => {
                      const occupied = (slot?.books ?? []).slice(0, Math.max(1, slot?.capacity ?? 1));
                      const book = occupied[compartmentIndex];
                      const isFilled = Boolean(book);
                      return (
                        <div key={`${slot?.id ?? index}-${compartmentIndex}`} className={`rounded-lg border p-3 ${isFilled ? "bg-primary/10" : "bg-background"}`}>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Boxes className="size-4" />
                            Compartment {compartmentIndex + 1}
                          </div>
                          {isFilled ? (
                            <p className="mt-2 text-sm text-muted-foreground">{book.title}</p>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">Available</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: slot.id, input: { capacity: (slot.capacity ?? 1) + 1 } })}>
                    +1 cap
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: slot.id, input: { capacity: Math.max(1, (slot.capacity ?? 1) - 1) } })}>
                    -1 cap
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => deleteMutation.mutate(slot.id)}>
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
