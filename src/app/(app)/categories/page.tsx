"use client";

import { z } from "zod";
import { TaxonomyPage } from "@/features/taxonomy/taxonomy-page";
import { categoriesApi } from "@/lib/api/services";
import type { Category } from "@/lib/types";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Add a short description (5+ characters)"),
});

export default function CategoriesPage() {
  return (
    <TaxonomyPage<Category, typeof categorySchema>
      entity="Category"
      entityPlural="Categories"
      description="Organize the catalog into browsable subject areas."
      queryKey="categories"
      api={categoriesApi}
      schema={categorySchema}
      fields={[
        { name: "name", label: "Name", placeholder: "e.g. Science Fiction" },
        { name: "description", label: "Description", placeholder: "What belongs in this category?", textarea: true },
      ]}
      emptyValues={{ name: "", description: "" }}
      extraColumns={[
        {
          accessorKey: "description",
          header: "Description",
          cell: ({ row }) => (
            <span className="line-clamp-1 max-w-md text-muted-foreground">{row.original.description}</span>
          ),
        },
      ]}
    />
  );
}
