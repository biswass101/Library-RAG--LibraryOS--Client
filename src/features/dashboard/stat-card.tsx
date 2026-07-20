"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  iconClassName?: string;
  index?: number;
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  delta,
  hint,
  iconClassName,
  index = 0,
  isLoading = false,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {value !== undefined ? formatNumber(value) : "—"}
              </p>
            )}
            {isLoading ? (
              <Skeleton className="h-3.5 w-24" />
            ) : delta !== undefined ? (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    delta >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {delta >= 0 ? (
                    <TrendingUp className="size-3.5" aria-hidden />
                  ) : (
                    <TrendingDown className="size-3.5" aria-hidden />
                  )}
                  {Math.abs(delta)}%
                </span>
                vs last month
              </p>
            ) : hint ? (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
              iconClassName
            )}
          >
            <Icon className="size-5" aria-hidden />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
