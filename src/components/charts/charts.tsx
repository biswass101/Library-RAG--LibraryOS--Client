"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BorrowTrendPoint, CategoryShare, MonthlyStatPoint } from "@/lib/types";

/**
 * Shared Recharts building blocks with consistent theming.
 * All colors come from CSS chart variables so light/dark both work.
 */

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--popover-foreground)",
  fontSize: 12,
  boxShadow: "0 4px 12px oklch(0 0 0 / 8%)",
};

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

export function BorrowTrendChart({ data }: { data: BorrowTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="fillBorrowed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.32} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillReturned" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="borrowed"
          name="Borrowed"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#fillBorrowed)"
          animationDuration={800}
        />
        <Area
          type="monotone"
          dataKey="returned"
          name="Returned"
          stroke="var(--chart-3)"
          strokeWidth={2}
          fill="url(#fillReturned)"
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({ data }: { data: CategoryShare[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={3}
          strokeWidth={0}
          animationDuration={800}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyStatsChart({ data }: { data: MonthlyStatPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="newMembers" name="New members" fill="var(--chart-1)" radius={[4, 4, 0, 0]} animationDuration={800} />
        <Bar dataKey="newBooks" name="New books" fill="var(--chart-2)" radius={[4, 4, 0, 0]} animationDuration={800} />
        <Bar dataKey="finesCollected" name="Fines ($)" fill="var(--chart-4)" radius={[4, 4, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function NamedBarChart({
  data,
  color = "var(--chart-1)",
  horizontal = false,
}: {
  data: { name: string; value: number }[];
  color?: string;
  horizontal?: boolean;
}) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey="name" width={110} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar dataKey="value" name="Count" fill={color} radius={[0, 4, 4, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <Bar dataKey="value" name="Count" fill={color} radius={[4, 4, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SharePieChart({ data }: { data: { name: string; value: number }[] }) {
  return <CategoryPieChart data={data} />;
}
