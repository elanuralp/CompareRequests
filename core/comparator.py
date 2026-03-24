from decimal import Decimal
from typing import Dict, List, Tuple

from core.models import (
    ComparisonSummary,
    FieldDifference,
    ParsedResponse,
    RecordComparisonResult,
    TaxRecord,
)

AMOUNT_TOLERANCE = Decimal("0.01")


def amount_equal(left, right, tolerance=AMOUNT_TOLERANCE) -> bool:
    if left is None and right is None:
        return True
    if left is None or right is None:
        return False
    return abs(left - right) <= tolerance


def value_equal(left, right) -> bool:
    return left == right


def build_index(records: List[TaxRecord]) -> Dict[Tuple[str, str, str], TaxRecord]:
    index = {}
    fallback_counter = 1

    for record in records:
        key = record.business_key()

        if key == ("", "", ""):
            key = ("__UNKEYED__", str(fallback_counter), record.reference_id or "")
            fallback_counter += 1

        if key in index:
            continue

        index[key] = record

    return index


def compare_records(left: TaxRecord, right: TaxRecord) -> List[FieldDifference]:
    diffs: List[FieldDifference] = []

    if not value_equal(left.tax_code, right.tax_code):
        diffs.append(FieldDifference("tax_code", left.tax_code, right.tax_code))

    if not value_equal(left.tax_type, right.tax_type):
        diffs.append(FieldDifference("tax_type", left.tax_type, right.tax_type))

    if not value_equal(left.tax_point, right.tax_point):
        diffs.append(FieldDifference("tax_point", left.tax_point, right.tax_point))

    if not value_equal(left.tax_point_tag, right.tax_point_tag):
        diffs.append(FieldDifference("tax_point_tag", left.tax_point_tag, right.tax_point_tag))

    if not value_equal(left.reference_id, right.reference_id):
        diffs.append(FieldDifference("reference_id", left.reference_id, right.reference_id))

    if not amount_equal(left.original_amount, right.original_amount):
        diffs.append(FieldDifference("original_amount", left.original_amount, right.original_amount))

    if not value_equal(left.original_currency, right.original_currency):
        diffs.append(FieldDifference("original_currency", left.original_currency, right.original_currency))

    if not amount_equal(left.sale_amount, right.sale_amount):
        diffs.append(FieldDifference("sale_amount", left.sale_amount, right.sale_amount))

    if not value_equal(left.sale_currency, right.sale_currency):
        diffs.append(FieldDifference("sale_currency", left.sale_currency, right.sale_currency))

    return diffs


def compare_parsed_responses(left: ParsedResponse, right: ParsedResponse) -> ComparisonSummary:
    summary = ComparisonSummary()

    left_index = build_index(left.records)
    right_index = build_index(right.records)

    all_keys = sorted(set(left_index.keys()) | set(right_index.keys()))

    for key in all_keys:
        left_record = left_index.get(key)
        right_record = right_index.get(key)

        if left_record is None and right_record is not None:
            summary.missing_in_left.append(right_record)
            continue

        if right_record is None and left_record is not None:
            summary.missing_in_right.append(left_record)
            continue

        diffs = compare_records(left_record, right_record)
        result = RecordComparisonResult(
            business_key=key,
            status="PASS" if not diffs else "FAIL",
            differences=diffs,
            left_record=left_record,
            right_record=right_record,
        )

        if diffs:
            summary.mismatched.append(result)
        else:
            summary.matched.append(result)

    return summary