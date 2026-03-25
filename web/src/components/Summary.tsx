import type { ComparisonSummary } from "@/lib/types";

interface SummaryProps {
  summary: ComparisonSummary;
}

export function Summary({ summary }: SummaryProps) {
  const isPass = summary.status === "PASS";

  return (
    <div className="space-y-4">
      <div
        className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ${
          isPass
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
        }`}
      >
        {isPass ? "PASS" : "FAIL"}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Matched" value={summary.matched.length} variant="green" />
        <StatCard label="Mismatched" value={summary.mismatched.length} variant={summary.mismatched.length > 0 ? "red" : "default"} />
        <StatCard label="Missing in QPX" value={summary.missing_in_left.length} variant={summary.missing_in_left.length > 0 ? "orange" : "default"} />
        <StatCard label="Missing in TANGO" value={summary.missing_in_right.length} variant={summary.missing_in_right.length > 0 ? "orange" : "default"} />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  variant?: "default" | "green" | "red" | "orange";
}

function StatCard({ label, value, variant = "default" }: StatCardProps) {
  const colorMap = {
    default: "text-foreground",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className={`text-3xl font-bold ${colorMap[variant]}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
