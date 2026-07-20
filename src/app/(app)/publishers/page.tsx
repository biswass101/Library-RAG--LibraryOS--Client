"use client";

import { z } from "zod";
import { TaxonomyPage } from "@/features/taxonomy/taxonomy-page";
import { publishersApi } from "@/lib/api/services";
import type { Publisher } from "@/lib/types";

const publisherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  website: z.string().url("Enter a valid URL (https://…)"),
  address: z.string().min(3, "Address is required"),
});

export default function PublishersPage() {
  return (
    <TaxonomyPage<Publisher, typeof publisherSchema>
      entity="Publisher"
      entityPlural="Publishers"
      description="Track the publishing houses behind your catalog."
      queryKey="publishers"
      api={publishersApi}
      schema={publisherSchema}
      fields={[
        { name: "name", label: "Name", placeholder: "e.g. Penguin Random House" },
        { name: "website", label: "Website", placeholder: "https://…" },
        { name: "address", label: "Address", placeholder: "City, Country" },
      ]}
      emptyValues={{ name: "", website: "", address: "" }}
      extraColumns={[
        {
          accessorKey: "website",
          header: "Website",
          cell: ({ row }) => (
            <a
              href={row.original.website}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.website.replace(/^https?:\/\//, "")}
            </a>
          ),
        },
        { accessorKey: "address", header: "Address" },
      ]}
    />
  );
}
