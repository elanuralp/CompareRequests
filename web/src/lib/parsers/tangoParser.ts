import type { ParsedResponse, TaxRecord } from "../types";
import { getNested, normalizeText, safeDecimal } from "../utils";

function extractSequenceNumberFromRefRecordId(
  refRecordId: string | null
): string | null {
  if (!refRecordId) return null;
  const match = refRecordId.match(/_([0-9]+)_[^_]+$/);
  return match ? match[1] : null;
}

export function parseTangoResponse(rawText: string): ParsedResponse {
  const cleaned = rawText
    .trim()
    .replace("\ufeff", "")
    .replace("\u00a0", " ")
    .replace("\u201c", '"')
    .replace("\u201d", '"')
    .replace("\u2018", "'")
    .replace("\u2019", "'");

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(cleaned);
  } catch {
    throw new Error("TANGO JSON is invalid");
  }

  const result: ParsedResponse = { source: "TANGO", records: [], warnings: [] };

  const rows = getNested(payload, "taxCalculationSearchResult");
  if (!Array.isArray(rows)) {
    throw new Error(
      "TANGO JSON does not contain a valid 'taxCalculationSearchResult' list."
    );
  }

  for (const item of rows) {
    if (typeof item !== "object" || item === null) {
      result.warnings.push(
        "Skipped one non-object item in taxCalculationSearchResult."
      );
      continue;
    }

    const row = item as Record<string, unknown>;
    const fullRef = normalizeText(row.refRecordId as string);

    const record: TaxRecord = {
      source: "TANGO",
      reference_id: extractSequenceNumberFromRefRecordId(fullRef),
      tax_code: normalizeText(row.taxCode as string),
      tax_type: normalizeText(row.taxType as string),
      nation: normalizeText(row.nation as string),
      tax_point_tag: normalizeText(row.taxPointTag as string),
      tax_point: normalizeText(row.taxPoint as string),
      original_amount: safeDecimal(
        getNested(row, "originalFare.amount.stringValue")
      ),
      original_currency: normalizeText(
        getNested(row, "originalFare.currencyCode") as string
      ),
      sale_amount: safeDecimal(
        getNested(row, "saleFare.amount.stringValue")
      ),
      sale_currency: normalizeText(
        getNested(row, "saleFare.currencyCode") as string
      ),
      value_capped: (row.valueCapped as boolean) ?? null,
      raw: row,
    };

    result.records.push(record);
  }

  return result;
}
