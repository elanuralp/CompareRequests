import type { TaxRecord } from "@/lib/types";
import { RecordTable } from "./RecordTable";

interface RecordsTabProps {
  records: TaxRecord[];
  label: string;
}

export function RecordsTab({ records, label }: RecordsTabProps) {
  const sorted = [...records].sort((a, b) => {
    const keyA = [a.tax_code, a.tax_type, a.tax_point, a.reference_id]
      .map((v) => v ?? "")
      .join("|");
    const keyB = [b.tax_code, b.tax_type, b.tax_point, b.reference_id]
      .map((v) => v ?? "")
      .join("|");
    return keyA.localeCompare(keyB);
  });

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No {label} records parsed.</p>;
  }

  return <RecordTable records={sorted} />;
}
