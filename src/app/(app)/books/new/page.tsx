"use client";

import { PageHeader } from "@/components/shared/page-header";
import { BookForm } from "@/features/books/book-form";

export default function NewBookPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      <PageHeader title="Add Book" description="Register a new title in the catalog." />
      <BookForm />
    </div>
  );
}
