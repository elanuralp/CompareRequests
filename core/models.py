from dataclasses import dataclass, field
from decimal import Decimal
from typing import List, Optional, Tuple


@dataclass
class TaxRecord:
    source: str
    reference_id: Optional[str] = None
    tax_code: Optional[str] = None
    tax_type: Optional[str] = None
    nation: Optional[str] = None
    tax_point_tag: Optional[str] = None
    tax_point: Optional[str] = None
    original_amount: Optional[Decimal] = None
    original_currency: Optional[str] = None
    sale_amount: Optional[Decimal] = None
    sale_currency: Optional[str] = None
    value_capped: Optional[bool] = None

    carrier: Optional[str] = None
    name: Optional[str] = None
    record_x1_tax_type: Optional[str] = None

    raw: dict = field(default_factory=dict)

    def business_key(self) -> Tuple[str, str, str]:
        return (
            (self.tax_code or "").strip(),
            (self.tax_type or "").strip(),
            (self.tax_point or "").strip(),
        )


@dataclass
class ParsedResponse:
    source: str
    records: List[TaxRecord] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


@dataclass
class FieldDifference:
    field_name: str
    left_value: object
    right_value: object


@dataclass
class RecordComparisonResult:
    business_key: Tuple[str, str, str]
    status: str
    differences: List[FieldDifference] = field(default_factory=list)
    left_record: Optional[TaxRecord] = None
    right_record: Optional[TaxRecord] = None


@dataclass
class ComparisonSummary:
    matched: List[RecordComparisonResult] = field(default_factory=list)
    mismatched: List[RecordComparisonResult] = field(default_factory=list)
    missing_in_left: List[TaxRecord] = field(default_factory=list)
    missing_in_right: List[TaxRecord] = field(default_factory=list)

    @property
    def total_compared(self) -> int:
        return len(self.matched) + len(self.mismatched)

    @property
    def status(self) -> str:
        if self.mismatched or self.missing_in_left or self.missing_in_right:
            return "FAIL"
        return "PASS"