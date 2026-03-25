import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAPPINGS: [string, string, string][] = [
  ["price", "originalFare", "Original Fare"],
  ["salePrice", "saleFare", "Sale Fare"],
  ["subcode", "taxType", "Tax Type"],
  ["sequenceNumber", "refRecordId", "Reference ID"],
];

export function MappingTab() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Mapping Assumptions</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>QPX Field</TableHead>
              <TableHead>TANGO Field</TableHead>
              <TableHead>Meaning</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MAPPINGS.map(([qpx, tango, meaning]) => (
              <TableRow key={qpx}>
                <TableCell className="font-mono text-xs">{qpx}</TableCell>
                <TableCell className="font-mono text-xs">{tango}</TableCell>
                <TableCell className="text-sm">{meaning}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
