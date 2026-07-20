"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { BookForm } from "@/features/books/book-form";
import { booksApi } from "@/lib/api/services";

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const { data: book, isPending, isError, refetch } = useQuery({
    queryKey: ["books", id],
    queryFn: () => booksApi.get(id),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      <PageHeader
        title={book ? `Edit: ${book.title}` : "Edit Book"}
        description="Update bibliographic details and inventory."
      />
      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} message="This book could not be loaded." />
      ) : (
        <BookForm book={book} />
      )}
    </div>
  );
}
