"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import type { ListParams } from "@/lib/api/services";
import type { Paginated } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface DataTableFilter {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<TData> {
  /** Stable key identifying this table's query cache. */
  queryKey: readonly unknown[];
  queryFn: (params: ListParams) => Promise<Paginated<TData>>;
  columns: ColumnDef<TData, unknown>[];
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  emptyTitle?: string;
  emptyDescription?: string;
  /** Toolbar-level actions rendered on selection (receives selected rows). */
  renderSelectionActions?: (rows: TData[], clear: () => void) => React.ReactNode;
  toolbarExtra?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  initialSort?: { id: string; desc: boolean };
  pageSize?: number;
}

const PAGE_SIZES = [10, 20, 50] as const;

export function DataTable<TData>({
  queryKey,
  queryFn,
  columns,
  searchPlaceholder = "Search…",
  filters = [],
  emptyTitle = "Nothing here yet",
  emptyDescription = "No records match your current search and filters.",
  renderSelectionActions,
  toolbarExtra,
  onRowClick,
  getRowId,
  initialSort,
  pageSize: initialPageSize = 10,
}: DataTableProps<TData>) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>(initialSort ? [initialSort] : []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});

  // Debounce search input → query param.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params: ListParams = {
    page,
    pageSize,
    search: search || undefined,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined,
    filters: filterValues,
  };

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => queryFn(params),
    placeholderData: keepPreviousData,
  });

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    pageCount: data?.pageCount ?? -1,
    enableRowSelection: true,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const clearSelection = React.useCallback(() => setRowSelection({}), []);
  const hasActiveFilters = Object.values(filterValues).some((v) => v && v !== "all");
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="pl-8"
            />
          </div>
          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={filterValues[filter.key] ?? "all"}
              onValueChange={(value) => {
                setFilterValues((prev) => ({ ...prev, [filter.key]: value }));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]" aria-label={`Filter by ${filter.label}`}>
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterValues({});
                setPage(1);
              }}
            >
              <X data-icon="inline-start" />
              Clear
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {toolbarExtra}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 data-icon="inline-start" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllLeafColumns()
                .filter((c) => c.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    className="capitalize"
                  >
                    {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Selection bar */}
      {selectedRows.length > 0 && renderSelectionActions ? (
        <div className="flex items-center justify-between rounded-lg border bg-accent/60 px-3 py-2">
          <p className="text-sm font-medium">
            {selectedRows.length} row{selectedRows.length > 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-2">{renderSelectionActions(selectedRows, clearSelection)}</div>
        </div>
      ) : null}

      {/* Table */}
      <div className={cn("overflow-hidden rounded-xl border bg-card shadow-xs transition-opacity", isFetching && !isPending && "opacity-70")}>
        {isError ? (
          <ErrorState className="border-0" onRetry={() => refetch()} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sortDir = header.column.getIsSorted();
                      return (
                        <TableHead key={header.id} aria-sort={sortDir ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left font-medium transition-colors hover:text-foreground"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sortDir === "asc" ? (
                                <ArrowUp className="size-3.5" aria-hidden />
                              ) : sortDir === "desc" ? (
                                <ArrowDown className="size-3.5" aria-hidden />
                              ) : (
                                <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />
                              )}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: visibleColumnCount }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full max-w-32" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={visibleColumnCount} className="p-0">
                      <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} className="border-0" />
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className={cn(onRowClick && "cursor-pointer")}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger size="sm" className="w-[70px]" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page">
                <ChevronsLeft />
              </Button>
              <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft />
              </Button>
              <span className="min-w-20 px-1 text-center text-sm tabular-nums">
                {data.page} / {data.pageCount}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= data.pageCount}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= data.pageCount}
                onClick={() => setPage(data.pageCount)}
                aria-label="Last page"
              >
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
