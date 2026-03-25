import type { ComparisonSummary } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DifferencesTabProps {
  summary: ComparisonSummary;
}

export function DifferencesTab({ summary }: DifferencesTabProps) {
  if (summary.mismatched.length === 0) {
    return (
      <Alert>
        <AlertDescription>No mismatches found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {summary.mismatched.map((result, i) => (
        <Alert key={i} variant="destructive">
          <AlertDescription>
            <div className="font-semibold mb-2">
              Mismatch → {result.business_key.join(" | ")}
            </div>
            {result.differences.map((diff, j) => (
              <div key={j} className="text-sm font-mono">
                <span className="font-medium">{diff.field_name}</span>
                {" → "}
                <span>QPX: </span>
                <code className="text-xs bg-muted px-1 rounded">
                  {String(diff.left_value ?? "null")}
                </code>
                {" | "}
                <span>TANGO: </span>
                <code className="text-xs bg-muted px-1 rounded">
                  {String(diff.right_value ?? "null")}
                </code>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
