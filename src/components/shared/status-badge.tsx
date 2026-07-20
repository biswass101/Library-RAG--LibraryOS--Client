import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Central mapping of every domain status to a consistent tone. */
const TONE_CLASSES = {
  success: "bg-success/12 text-success border-transparent dark:bg-success/18",
  warning: "bg-warning/15 text-warning border-transparent dark:bg-warning/20",
  destructive: "bg-destructive/10 text-destructive border-transparent dark:bg-destructive/18",
  info: "bg-primary/10 text-primary border-transparent dark:bg-primary/18",
  neutral: "bg-muted text-muted-foreground border-transparent",
} as const;

type Tone = keyof typeof TONE_CLASSES;

const STATUS_TONES: Record<string, Tone> = {
  // books
  available: "success",
  "low-stock": "warning",
  "out-of-stock": "destructive",
  // members
  active: "success",
  suspended: "destructive",
  expired: "neutral",
  // borrows
  borrowed: "info",
  returned: "success",
  overdue: "destructive",
  renewed: "warning",
  // fines
  paid: "success",
  unpaid: "destructive",
  waived: "neutral",
  // reservations
  pending: "info",
  ready: "success",
  fulfilled: "neutral",
  cancelled: "neutral",
  // documents
  processing: "warning",
  indexed: "success",
  failed: "destructive",
  // plans
  standard: "neutral",
  premium: "info",
  student: "warning",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = STATUS_TONES[status] ?? "neutral";
  return (
    <Badge variant="outline" className={cn("capitalize", TONE_CLASSES[tone], className)}>
      {status.replace(/-/g, " ")}
    </Badge>
  );
}
