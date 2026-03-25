export type BusinessKey = [string, string, string];

export interface TaxRecord {
  source: string;
  reference_id: string | null;
  tax_code: string | null;
  tax_type: string | null;
  nation: string | null;
  tax_point_tag: string | null;
  tax_point: string | null;
  original_amount: number | null;
  original_currency: string | null;
  sale_amount: number | null;
  sale_currency: string | null;
  value_capped?: boolean | null;
  carrier?: string | null;
  name?: string | null;
  record_x1_tax_type?: string | null;
  raw?: unknown;
}

export interface ParsedResponse {
  source: string;
  records: TaxRecord[];
  warnings: string[];
}

export interface FieldDifference {
  field_name: string;
  left_value: unknown;
  right_value: unknown;
}

export interface RecordComparisonResult {
  business_key: BusinessKey;
  status: string;
  differences: FieldDifference[];
  left_record: TaxRecord | null;
  right_record: TaxRecord | null;
}

export interface ComparisonSummary {
  matched: RecordComparisonResult[];
  mismatched: RecordComparisonResult[];
  missing_in_left: TaxRecord[];
  missing_in_right: TaxRecord[];
  get status(): string;
  get total_compared(): number;
}
