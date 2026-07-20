"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { motion } from "framer-motion";

interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  action?: React.ReactNode;
  height?: number;
  children: React.ReactNode;
}

/** Consistent wrapper for every Recharts chart: header, loading and error states. */
export function ChartCard({
  title,
  description,
  isLoading,
  isError,
  onRetry,
  action,
  height = 300,
  children,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col justify-end gap-2" style={{ height }}>
              <div className="flex h-full items-end gap-3 px-2">
                {[65, 40, 80, 55, 90, 45, 70, 60].map((h, i) => (
                  <Skeleton key={i} className="w-full" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          ) : isError ? (
            <ErrorState className="py-8" onRetry={onRetry} message="This chart failed to load." />
          ) : (
            <div style={{ height }}>{children}</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
