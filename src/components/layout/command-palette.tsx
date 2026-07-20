"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, Library, Loader2, Users } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_SECTIONS } from "@/components/layout/nav-config";
import { searchApi } from "@/lib/api/services";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => searchApi.global(query),
    enabled: open && query.trim().length >= 2,
  });

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Search across the library">
      <Command shouldFilter={query.trim().length < 2}>
      <CommandInput
        placeholder="Search books, members, documents or jump to a page…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isFetching ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Searching…
            </span>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {data?.books.length ? (
          <CommandGroup heading="Books">
            {data.books.map((b) => (
              <CommandItem key={b.id} value={`book-${b.id}-${b.title}`} onSelect={() => go(`/books/${b.id}`)}>
                <Library aria-hidden />
                <span className="truncate">{b.title}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{b.authorName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.members.length ? (
          <CommandGroup heading="Members">
            {data.members.map((m) => (
              <CommandItem key={m.id} value={`member-${m.id}-${m.name}`} onSelect={() => go(`/members/${m.id}`)}>
                <Users aria-hidden />
                <span className="truncate">{m.name}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{m.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.documents.length ? (
          <CommandGroup heading="Documents">
            {data.documents.map((d) => (
              <CommandItem key={d.id} value={`doc-${d.id}-${d.name}`} onSelect={() => go("/documents")}>
                <FileText aria-hidden />
                <span className="truncate">{d.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {(data && (data.books.length || data.members.length || data.documents.length)) ? <CommandSeparator /> : null}

        <CommandGroup heading="Pages">
          {NAV_SECTIONS.flatMap((s) => s.items).map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.href} value={`page-${item.title}`} onSelect={() => go(item.href)}>
                <Icon aria-hidden />
                {item.title}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
