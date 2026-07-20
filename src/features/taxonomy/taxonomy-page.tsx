"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import type { ListParams } from "@/lib/api/services";
import { formatDate } from "@/lib/format";
import type { Paginated } from "@/lib/types";

interface FieldConfig<TValues> {
  name: keyof TValues & string;
  label: string;
  placeholder?: string;
  textarea?: boolean;
}

interface TaxonomyRow {
  id: string;
  name: string;
  bookCount: number;
  createdAt: string;
}

interface TaxonomyApi<TRow, TInput> {
  list: (params: ListParams) => Promise<Paginated<TRow>>;
  create: (input: TInput) => Promise<TRow>;
  update: (id: string, input: Partial<TRow>) => Promise<TRow>;
  remove: (id: string) => Promise<void>;
}

interface TaxonomyPageProps<TRow extends TaxonomyRow, TSchema extends z.ZodType<FieldValues>> {
  /** Singular and plural entity labels, e.g. "Category" / "Categories". */
  entity: string;
  entityPlural: string;
  description: string;
  queryKey: string;
  api: TaxonomyApi<TRow, z.infer<TSchema>>;
  schema: TSchema;
  fields: FieldConfig<z.infer<TSchema>>[];
  emptyValues: DefaultValues<z.infer<TSchema>>;
  /** Extra list columns between name and book count. */
  extraColumns?: ColumnDef<TRow, unknown>[];
}

export function TaxonomyPage<TRow extends TaxonomyRow, TSchema extends z.ZodType<FieldValues>>({
  entity,
  entityPlural,
  description,
  queryKey,
  api,
  schema,
  fields,
  emptyValues,
  extraColumns = [],
}: TaxonomyPageProps<TRow, TSchema>) {
  type Values = z.infer<TSchema>;

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TRow | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: Values) => (editing ? api.update(editing.id, values as Partial<TRow>) : api.create(values)),
    onSuccess: (saved) => {
      invalidate();
      toast.success(editing ? `${entity} updated` : `${entity} created`, {
        description: `"${saved.name}" has been saved.`,
      });
      setDialogOpen(false);
    },
    onError: (error) =>
      toast.error("Save failed", { description: error instanceof Error ? error.message : "Please try again." }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success(`${entity} deleted`, { description: `"${deleteTarget?.name}" was removed.` });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Delete failed", { description: "Please try again." }),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyValues);
    setDialogOpen(true);
  };

  const openEdit = React.useCallback(
    (row: TRow) => {
      setEditing(row);
      const values = Object.fromEntries(fields.map((f) => [f.name, (row as Record<string, unknown>)[f.name] ?? ""]));
      form.reset(values as Values);
      setDialogOpen(true);
    },
    [fields, form]
  );

  const columns = React.useMemo<ColumnDef<TRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      ...extraColumns,
      {
        accessorKey: "bookCount",
        header: "Books",
        cell: ({ row }) => <Badge variant="secondary">{row.original.bookCount}</Badge>,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.original.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openEdit(row.original)}>
                <Pencil aria-hidden /> Edit
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
    [extraColumns, openEdit]
  );

  const isBusy = saveMutation.isPending;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title={entityPlural}
        description={description}
        actions={
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Add {entity}
          </Button>
        }
      />

      <DataTable<TRow>
        queryKey={[queryKey]}
        queryFn={api.list}
        columns={columns}
        searchPlaceholder={`Search ${entityPlural.toLowerCase()}…`}
        emptyTitle={`No ${entityPlural.toLowerCase()} found`}
        emptyDescription={`Create your first ${entity.toLowerCase()} to organize the catalog.`}
        getRowId={(row) => row.id}
        initialSort={{ id: "name", desc: false }}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => !isBusy && setDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${entity}` : `New ${entity}`}</DialogTitle>
            <DialogDescription>
              {editing ? `Update details for "${editing.name}".` : `Add a new ${entity.toLowerCase()} to the system.`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} noValidate className="space-y-4">
              {fields.map((f) => (
                <FormField
                  key={f.name}
                  control={form.control}
                  name={f.name as Path<Values>}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{f.label}</FormLabel>
                      <FormControl>
                        {f.textarea ? (
                          <Textarea rows={3} placeholder={f.placeholder} disabled={isBusy} {...field} />
                        ) : (
                          <Input placeholder={f.placeholder} disabled={isBusy} {...field} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={isBusy} onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isBusy}>
                  {isBusy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
                  {isBusy ? "Saving…" : editing ? "Save changes" : `Create ${entity}`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete this ${entity.toLowerCase()}?`}
        description={`"${deleteTarget?.name}" will be permanently removed. Books referencing it keep their current label.`}
        confirmLabel="Delete"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
