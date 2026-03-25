import type { TaxRecord } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLUMNS = [
  "Tax Code",
  "Tax Type",
  "Tax Point",
  "Tax Point Tag",
  "Nation",
  "Original Amount",
  "Original Currency",
  "Sale Amount",
  "Sale Currency",
  "Ref ID",
] as const;

type ColumnKey = (typeof COLUMNS)[number];

const FIELD_MAP: Record<ColumnKey, keyof TaxRecord> = {
  "Tax Code": "tax_code",
  "Tax Type": "tax_type",
  "Tax Point": "tax_point",
  "Tax Point Tag": "tax_point_tag",
  "Nation": "nation",
  "Original Amount": "original_amount",
  "Original Currency": "original_currency",
  "Sale Amount": "sale_amount",
  "Sale Currency": "sale_currency",
  "Ref ID": "reference_id",
};

interface RecordTableProps {
  records: TaxRecord[];
}

export function RecordTable({ records }: RecordTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, i) => (
            <TableRow key={i}>
              {COLUMNS.map((col) => {
                const field = FIELD_MAP[col];
                const value = record[field];
                const display =
                  value === null || value === undefined
                    ? ""
                    : typeof value === "number"
                    ? String(value)
                    : String(value);
                return <TableCell key={col}>{display}</TableCell>;
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
