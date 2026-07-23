import { format, formatDistanceToNow, isPast, differenceInCalendarDays, isValid } from "date-fns";

type DateValue = string | Date | null | undefined;

const toSafeDate = (value: DateValue) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return isValid(parsed) ? parsed : null;
};

export const formatDate = (value: DateValue) => {
  const parsed = toSafeDate(value);
  return parsed ? format(parsed, "MMM d, yyyy") : "—";
};

export const formatDateTime = (value: DateValue) => {
  const parsed = toSafeDate(value);
  return parsed ? format(parsed, "MMM d, yyyy · h:mm a") : "—";
};

export const formatRelative = (value: DateValue) => {
  const parsed = toSafeDate(value);
  return parsed ? formatDistanceToNow(parsed, { addSuffix: true }) : "—";
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const isOverdue = (dueAt: DateValue) => {
  const parsed = toSafeDate(dueAt);
  return parsed ? isPast(parsed) : false;
};

export const daysUntil = (date: DateValue) => {
  const parsed = toSafeDate(date);
  if (!parsed) return 0;
  return differenceInCalendarDays(parsed, new Date());
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
