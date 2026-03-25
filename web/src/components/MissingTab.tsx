import type { ComparisonSummary } from "@/lib/types";
import { RecordTable } from "./RecordTable";

interface MissingTabProps {
  summary: ComparisonSummary;
}

export function MissingTab({ summary }: MissingTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Missing in QPX</h3>
        {summary.missing_in_left.length > 0 ? (
          <RecordTable records={summary.missing_in_left} />
        ) : (
          <p className="text-sm text-muted-foreground">None</p>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Missing in TANGO</h3>
        {summary.missing_in_right.length > 0 ? (
          <RecordTable records={summary.missing_in_right} />
        ) : (
          <p className="text-sm text-muted-foreground">None</p>
        )}
      </div>
    </div>
  );
}
