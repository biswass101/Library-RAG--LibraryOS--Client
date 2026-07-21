"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { authorsApi, booksApi, categoriesApi, publishersApi, type BookInput } from "@/lib/api/services";
import type { Book } from "@/lib/types";

const currentYear = new Date().getFullYear();

const bookSchema = z
  .object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    isbn: z
      .string()
      .min(10, "ISBN must be at least 10 characters")
      .regex(/^[0-9Xx-]+$/, "ISBN may only contain digits, dashes and X"),
    categoryId: z.string().min(1, "Select a category"),
    authorId: z.string().min(1, "Select an author"),
    publisherId: z.string().min(1, "Select a publisher"),
    publishedYear: z
      .number({ message: "Enter a valid year" })
      .int()
      .min(1400, "Year seems too old")
      .max(currentYear, `Year cannot exceed ${currentYear}`),
    totalCopies: z.number({ message: "Enter a number" }).int().min(1, "At least 1 copy"),
    availableCopies: z.number({ message: "Enter a number" }).int().min(0, "Cannot be negative"),
    shelfLocation: z.string().min(1, "Shelf location is required"),
    language: z.string().min(2, "Language is required"),
    pages: z.number({ message: "Enter a number" }).int().min(1, "At least 1 page"),
    description: z.string().min(10, "Add a short description (10+ characters)"),
  })
  .refine((v) => v.availableCopies <= v.totalCopies, {
    message: "Available copies cannot exceed total copies",
    path: ["availableCopies"],
  });

type BookFormValues = z.infer<typeof bookSchema>;

/** Converts native number-input events into numbers (undefined when cleared) for RHF. */
const numberChange =
  (onChange: (value: number | undefined) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value === "" ? undefined : e.target.valueAsNumber);

interface BookFormProps {
  book?: Book;
}

export function BookForm({ book }: BookFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(book);

  const categories = useQuery({ queryKey: ["categories", "all"], queryFn: categoriesApi.all });
  const authors = useQuery({ queryKey: ["authors", "all"], queryFn: authorsApi.all });
  const publishers = useQuery({ queryKey: ["publishers", "all"], queryFn: publishersApi.all });

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: book
      ? {
          title: book.title,
          isbn: book.isbn,
          categoryId: book.categoryId,
          authorId: book.authorId,
          publisherId: book.publisherId,
          publishedYear: book.publishedYear,
          totalCopies: book.totalCopies,
          availableCopies: book.availableCopies,
          shelfLocation: book.shelfLocation,
          language: book.language,
          pages: book.pages,
          description: book.description,
        }
      : {
          title: "",
          isbn: "",
          categoryId: "",
          authorId: "",
          publisherId: "",
          publishedYear: currentYear,
          totalCopies: undefined as unknown as number,
          availableCopies: undefined as unknown as number,
          shelfLocation: "",
          language: "English",
          pages: undefined as unknown as number,
          description: "",
        },
  });

  const mutation = useMutation({
    mutationFn: (values: BookFormValues) =>
      isEdit ? booksApi.update(book!.id, values as BookInput) : booksApi.create(values as BookInput),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(isEdit ? "Book updated" : "Book added", {
        description: `"${saved.title}" has been ${isEdit ? "updated" : "added to the catalog"}.`,
      });
      router.push(`/books/${saved.id}`);
    },
    onError: (error) => {
      toast.error(isEdit ? "Update failed" : "Creation failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const isBusy = mutation.isPending;
  const referencesLoading = categories.isPending || authors.isPending || publishers.isPending;

  if (referencesLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Book details</CardTitle>
            <CardDescription>Bibliographic information shown across the catalog.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. The Left Hand of Darkness" disabled={isBusy} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isbn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ISBN</FormLabel>
                  <FormControl>
                    <Input placeholder="978-0-00000-000-0" disabled={isBusy} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publishedYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Published year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder={`e.g. ${currentYear}`}
                      disabled={isBusy}
                      {...field}
                      value={field.value ?? ""}
                      onChange={numberChange(field.onChange)}
                      onFocus={(e) => e.target.select()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.data?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="authorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select author" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {authors.data?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publisherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publisher</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isBusy}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select publisher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {publishers.data?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <Input placeholder="English" disabled={isBusy} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="A short synopsis or catalog note…" disabled={isBusy} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory</CardTitle>
            <CardDescription>Copies and physical placement in the branch.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="totalCopies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total copies</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      placeholder="e.g. 1"
                      disabled={isBusy}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : e.target.valueAsNumber;
                        field.onChange(val);
                        if (form.getValues("availableCopies") === undefined) {
                          form.setValue("availableCopies", val as number);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="availableCopies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available copies</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="e.g. 1"
                      disabled={isBusy}
                      {...field}
                      value={field.value ?? ""}
                      onChange={numberChange(field.onChange)}
                      onFocus={(e) => e.target.select()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pages</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      placeholder="e.g. 100"
                      disabled={isBusy}
                      {...field}
                      value={field.value ?? ""}
                      onChange={numberChange(field.onChange)}
                      onFocus={(e) => e.target.select()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shelfLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shelf location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. T3-18" disabled={isBusy} {...field} />
                  </FormControl>
                  <FormDescription>Aisle-shelf code</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={isBusy} onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isBusy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            {isBusy ? "Saving…" : isEdit ? "Save changes" : "Add book"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
