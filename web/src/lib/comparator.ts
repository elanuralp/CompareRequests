import type {
  TaxRecord,
  ParsedResponse,
  FieldDifference,
  RecordComparisonResult,
  ComparisonSummary,
  BusinessKey,
} from "./types";

const AMOUNT_TOLERANCE = 0.01;

function amountEqual(left: number | null, right: number | null): boolean {
  if (left === null && right === null) return true;
  if (left === null || right === null) return false;
  return Math.abs(left - right) <= AMOUNT_TOLERANCE;
}

function valueEqual(left: unknown, right: unknown): boolean {
  return left === right;
}

function businessKey(record: TaxRecord): BusinessKey {
  return [
    (record.tax_code || "").trim(),
    (record.tax_type || "").trim(),
    (record.tax_point || "").trim(),
  ];
}

function buildIndex(records: TaxRecord[]): Map<string, TaxRecord> {
  const index = new Map<string, TaxRecord>();
  let fallbackCounter = 1;
  for (const record of records) {
    let key = businessKey(record);
    if (key[0] === "" && key[1] === "" && key[2] === "") {
      key = ["__UNKEYED__", String(fallbackCounter), record.reference_id || ""];
      fallbackCounter++;
    }
    const strKey = JSON.stringify(key);
    if (!index.has(strKey)) {
      index.set(strKey, record);
    }
  }
  return index;
}

function compareRecords(
  left: TaxRecord,
  right: TaxRecord
): FieldDifference[] {
  const diffs: FieldDifference[] = [];

  if (!valueEqual(left.tax_code, right.tax_code))
    diffs.push({ field_name: "tax_code", left_value: left.tax_code, right_value: right.tax_code });

  if (!valueEqual(left.tax_type, right.tax_type))
    diffs.push({ field_name: "tax_type", left_value: left.tax_type, right_value: right.tax_type });

  if (!valueEqual(left.tax_point, right.tax_point))
    diffs.push({ field_name: "tax_point", left_value: left.tax_point, right_value: right.tax_point });

  if (!valueEqual(left.tax_point_tag, right.tax_point_tag))
    diffs.push({ field_name: "tax_point_tag", left_value: left.tax_point_tag, right_value: right.tax_point_tag });

  if (!valueEqual(left.reference_id, right.reference_id))
    diffs.push({ field_name: "reference_id", left_value: left.reference_id, right_value: right.reference_id });

  if (!amountEqual(left.original_amount, right.original_amount))
    diffs.push({ field_name: "original_amount", left_value: left.original_amount, right_value: right.original_amount });

  if (!valueEqual(left.original_currency, right.original_currency))
    diffs.push({ field_name: "original_currency", left_value: left.original_currency, right_value: right.original_currency });

  if (!amountEqual(left.sale_amount, right.sale_amount))
    diffs.push({ field_name: "sale_amount", left_value: left.sale_amount, right_value: right.sale_amount });

  if (!valueEqual(left.sale_currency, right.sale_currency))
    diffs.push({ field_name: "sale_currency", left_value: left.sale_currency, right_value: right.sale_currency });

  return diffs;
}

function createComparisonSummary(): ComparisonSummary {
  const matched: RecordComparisonResult[] = [];
  const mismatched: RecordComparisonResult[] = [];
  const missing_in_left: TaxRecord[] = [];
  const missing_in_right: TaxRecord[] = [];

  return {
    get matched() { return matched; },
    get mismatched() { return mismatched; },
    get missing_in_left() { return missing_in_left; },
    get missing_in_right() { return missing_in_right; },
    get total_compared() { return matched.length + mismatched.length; },
    get status() {
      return mismatched.length > 0 || missing_in_left.length > 0 || missing_in_right.length > 0
        ? "FAIL"
        : "PASS";
    },
  };
}

export function compareParsedResponses(
  left: ParsedResponse,
  right: ParsedResponse
): ComparisonSummary {
  const summary = createComparisonSummary();

  const leftIndex = buildIndex(left.records);
  const rightIndex = buildIndex(right.records);

  const allKeys = [...new Set([...leftIndex.keys(), ...rightIndex.keys()])].sort();

  for (const strKey of allKeys) {
    const leftRecord = leftIndex.get(strKey) ?? null;
    const rightRecord = rightIndex.get(strKey) ?? null;

        if (leftRecord === null && rightRecord !== null) {
          summary.missing_in_left.push(rightRecord);
          continue;
        }

        if (rightRecord === null && leftRecord !== null) {
          summary.missing_in_right.push(leftRecord);
          continue;
        }

    const diffs = compareRecords(leftRecord!, rightRecord!);
    const businessKeyParsed = JSON.parse(strKey) as BusinessKey;
    const result: RecordComparisonResult = {
      business_key: businessKeyParsed,
      status: diffs.length === 0 ? "PASS" : "FAIL",
      differences: diffs,
      left_record: leftRecord,
      right_record: rightRecord,
    };

    if (diffs.length > 0) {
      summary.mismatched.push(result);
    } else {
      summary.matched.push(result);
    }
  }

  return summary;
}
