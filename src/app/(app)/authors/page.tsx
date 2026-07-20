"use client";

import { z } from "zod";
import { TaxonomyPage } from "@/features/taxonomy/taxonomy-page";
import { authorsApi } from "@/lib/api/services";
import type { Author } from "@/lib/types";

const authorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  country: z.string().min(2, "Country is required"),
  bio: z.string().min(10, "Add a short bio (10+ characters)"),
});

export default function AuthorsPage() {
  return (
    <TaxonomyPage<Author, typeof authorSchema>
      entity="Author"
      entityPlural="Authors"
      description="Manage the writers represented in your collection."
      queryKey="authors"
      api={authorsApi}
      schema={authorSchema}
      fields={[
        { name: "name", label: "Full name", placeholder: "e.g. Ursula K. Le Guin" },
        { name: "country", label: "Country", placeholder: "e.g. United States" },
        { name: "bio", label: "Biography", placeholder: "A short author bio…", textarea: true },
      ]}
      emptyValues={{ name: "", country: "", bio: "" }}
      extraColumns={[
        { accessorKey: "country", header: "Country" },
        {
          accessorKey: "bio",
          header: "Bio",
          cell: ({ row }) => <span className="line-clamp-1 max-w-sm text-muted-foreground">{row.original.bio}</span>,
        },
      ]}
    />
  );
}
