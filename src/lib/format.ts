import { format, formatDistanceToNow, isPast, differenceInCalendarDays } from "date-fns";

export const formatDate = (value: string | Date) => format(new Date(value), "MMM d, yyyy");

export const formatDateTime = (value: string | Date) => format(new Date(value), "MMM d, yyyy · h:mm a");

export const formatRelative = (value: string | Date) =>
  formatDistanceToNow(new Date(value), { addSuffix: true });

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const isOverdue = (dueAt: string) => isPast(new Date(dueAt));

export const daysUntil = (date: string) => differenceInCalendarDays(new Date(date), new Date());

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
