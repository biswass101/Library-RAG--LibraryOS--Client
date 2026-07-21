"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  FileImage,
  FileText,
  FileType,
  File as FileIcon,
  Layers,
  MoreHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { documentsApi } from "@/lib/api/services";
import { formatBytes, formatDate, formatRelative } from "@/lib/format";
import type { DocumentType, LibraryDocument } from "@/lib/types";

const DOC_ICONS: Record<DocumentType, React.ElementType> = {
  pdf: FileText,
  docx: FileType,
  txt: FileIcon,
  image: FileImage,
};

const DOC_COLORS: Record<DocumentType, string> = {
  pdf: "text-red-500",
  docx: "text-blue-500",
  txt: "text-slate-500",
  image: "text-emerald-500",
};

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

function UploadZone({
  onFilesSelected,
  isUploading,
  uploadProgress,
}: {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
  uploadProgress: number;
}) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFilesSelected(files);
  };

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center gap-4 py-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium">Drag & drop files here</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Supports PDF, DOCX, TXT, JPG, PNG, WebP
          </p>
        </div>
        {isUploading ? (
          <div className="w-full max-w-xs space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-center text-xs text-muted-foreground">Uploading & indexing…</p>
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              Browse files
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={Object.values(ACCEPTED).flat().join(",")}
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) onFilesSelected(files);
                e.target.value = "";
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentPreviewDialog({
  doc,
  open,
  onOpenChange,
}: {
  doc: LibraryDocument | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!doc) return null;
  const Icon = DOC_ICONS[doc.type];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${DOC_COLORS[doc.type]}`} />
            {doc.name}
          </DialogTitle>
          <DialogDescription>Document metadata and indexing details.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/30 p-4">
          {[
            ["Type", doc.type.toUpperCase()],
            ["Size", formatBytes(doc.sizeBytes)],
            ["Pages", doc.pages ?? "N/A"],
            ["Chunks", doc.chunkCount],
            ["Uploaded by", doc.uploadedBy],
            ["Indexed", formatRelative(doc.uploadedAt)],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium">{String(value)}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Status</p>
          <StatusBadge status={doc.status} />
          {doc.status === "indexed" && (
            <p className="mt-2 text-xs text-muted-foreground">
              This document is fully indexed and available for AI search queries.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [previewDoc, setPreviewDoc] = React.useState<LibraryDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<LibraryDocument | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const results = [];
      for (const file of files) {
        setUploadProgress(Math.round((results.length / files.length) * 80));
        const doc = await documentsApi.upload(file);
        results.push(doc);
      }
      setUploadProgress(100);
      return results;
    },
    onSuccess: (docs) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(
        docs.length === 1
          ? `"${docs[0].name}" uploaded and indexed`
          : `${docs.length} documents uploaded`
      );
      setTimeout(() => setUploadProgress(0), 1000);
    },
    onError: () => {
      toast.error("Upload failed", { description: "Please try again." });
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted", {
        description: `"${deleteTarget?.name}" was removed.`,
      });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const columns = React.useMemo<ColumnDef<LibraryDocument, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Document",
        cell: ({ row }) => {
          const doc = row.original;
          const Icon = DOC_ICONS[doc.type];
          return (
            <button
              className="flex items-center gap-3 text-left"
              onClick={() => setPreviewDoc(doc)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className={`h-4 w-4 ${DOC_COLORS[doc.type]}`} />
              </div>
              <div className="min-w-0">
                <p className="max-w-48 truncate font-medium hover:text-primary">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(doc.sizeBytes)}
                  {doc.pages ? ` · ${doc.pages} pages` : ""}
                </p>
              </div>
            </button>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary" className="uppercase text-xs font-mono">
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "chunkCount",
        header: "Chunks",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            {row.original.chunkCount}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "uploadedBy",
        header: "Uploaded by",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.uploadedBy}</span>
        ),
      },
      {
        accessorKey: "uploadedAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelative(row.original.uploadedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Document actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setPreviewDoc(row.original)}>
                <FileText aria-hidden /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteTarget(row.original)}
              >
                <Trash2 aria-hidden /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Documents"
        description="Upload and manage knowledge base documents for AI-powered search."
      />

      <UploadZone
        onFilesSelected={(files) => uploadMutation.mutate(files)}
        isUploading={uploadMutation.isPending}
        uploadProgress={uploadProgress}
      />

      <DataTable<LibraryDocument>
        queryKey={["documents"]}
        queryFn={documentsApi.list}
        columns={columns}
        searchPlaceholder="Search document name…"
        filters={[
          {
            key: "type",
            label: "Type",
            options: [
              { label: "PDF", value: "pdf" },
              { label: "DOCX", value: "docx" },
              { label: "TXT", value: "txt" },
              { label: "Image", value: "image" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Indexed", value: "indexed" },
              { label: "Processing", value: "processing" },
              { label: "Failed", value: "failed" },
            ],
          },
        ]}
        emptyTitle="No documents yet"
        emptyDescription="Upload a PDF, DOCX, TXT, or image to build the AI knowledge base."
        emptyIcon={FileText}
        getRowId={(d) => d.id}
        initialSort={{ id: "uploadedAt", desc: true }}
      />

      <DocumentPreviewDialog
        doc={previewDoc}
        open={Boolean(previewDoc)}
        onOpenChange={(v) => !v && setPreviewDoc(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this document?"
        description={`"${deleteTarget?.name}" will be removed from the knowledge base and cannot be recovered.`}
        confirmLabel="Delete"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
