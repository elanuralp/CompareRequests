import { describe, it, expect } from "vitest";
import type { TaxRecord, ParsedResponse } from "./lib/types";
import { compareParsedResponses } from "./lib/comparator";

function makeQpx(overrides: Partial<TaxRecord> = {}): TaxRecord {
  return {
    source: "QPX",
    reference_id: null,
    tax_code: null,
    tax_type: null,
    nation: null,
    tax_point_tag: null,
    tax_point: null,
    original_amount: null,
    original_currency: null,
    sale_amount: null,
    sale_currency: null,
    ...overrides,
  };
}

function makeTango(overrides: Partial<TaxRecord> = {}): TaxRecord {
  return makeQpx({ source: "TANGO", ...overrides });
}

function makeResponse(records: TaxRecord[]): ParsedResponse {
  return { source: "TEST", records, warnings: [] };
}

describe("compareParsedResponses", () => {
  describe("matched records", () => {
    it("marks records with identical business keys as matched", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.status).toBe("PASS");
      expect(result.matched).toHaveLength(1);
      expect(result.mismatched).toHaveLength(0);
      expect(result.missing_in_left).toHaveLength(0);
      expect(result.missing_in_right).toHaveLength(0);
    });

    it("matches multiple identical records", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
        makeQpx({ tax_code: "UK", tax_type: "002", tax_point: "LHR" }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
        makeTango({ tax_code: "UK", tax_type: "002", tax_point: "LHR" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.status).toBe("PASS");
      expect(result.matched).toHaveLength(2);
    });
  });

  describe("mismatched fields", () => {
    it("flags mismatched original_amount as difference", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100 }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 200 }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.status).toBe("FAIL");
      expect(result.mismatched).toHaveLength(1);
      expect(result.matched).toHaveLength(0);
      expect(result.mismatched[0].differences).toContainEqual(
        expect.objectContaining({ field_name: "original_amount", left_value: 100, right_value: 200 })
      );
    });

    it("flags mismatched tax_type as difference when business keys match", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100 }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100, sale_amount: 200 }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched).toHaveLength(1);
      expect(result.mismatched[0].differences).toContainEqual(
        expect.objectContaining({ field_name: "sale_amount" })
      );
    });

    it("captures multiple field differences in one record", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100, sale_amount: 50 }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 200, sale_amount: 80 }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched).toHaveLength(1);
      expect(result.mismatched[0].differences.length).toBeGreaterThan(1);
    });
  });

  describe("amount tolerance", () => {
    it("matches amounts within 0.01 tolerance", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100 }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100.005 }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.status).toBe("PASS");
      expect(result.matched).toHaveLength(1);
    });

    it("flags amounts differing by more than 0.01", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100 }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100.02 }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.status).toBe("FAIL");
      expect(result.mismatched).toHaveLength(1);
    });

    it("treats both null as equal for amount", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: null }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: null }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.matched).toHaveLength(1);
    });

    it("treats one null and one value as not equal", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: null }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100 }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched).toHaveLength(1);
    });
  });

  describe("missing records", () => {
    it("marks record only in right as missing_in_left", () => {
      const left = makeResponse([]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.missing_in_left).toHaveLength(1);
      expect(result.missing_in_left[0].source).toBe("TANGO");
      expect(result.status).toBe("FAIL");
    });

    it("marks record only in left as missing_in_right", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
      ]);
      const right = makeResponse([]);

      const result = compareParsedResponses(left, right);

      expect(result.missing_in_right).toHaveLength(1);
      expect(result.missing_in_right[0].source).toBe("QPX");
    });

    it("handles both sides empty", () => {
      const left = makeResponse([]);
      const right = makeResponse([]);

      const result = compareParsedResponses(left, right);

      expect(result.status).toBe("PASS");
      expect(result.matched).toHaveLength(0);
      expect(result.mismatched).toHaveLength(0);
      expect(result.missing_in_left).toHaveLength(0);
      expect(result.missing_in_right).toHaveLength(0);
    });
  });

  describe("business key", () => {
    it("uses tax_code, tax_type, tax_point as business key", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched).toHaveLength(0);
      expect(result.matched).toHaveLength(1);
      expect(result.matched[0].business_key).toEqual(["US", "001", "JFK"]);
    });

    it("records with different business keys are treated as missing on both sides", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "UK", tax_type: "002", tax_point: "LHR" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched).toHaveLength(0);
      expect(result.missing_in_left).toHaveLength(1);
      expect(result.missing_in_right).toHaveLength(1);
    });

    it("trims whitespace in business key deduplication but compares raw fields", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "  US  ", tax_type: "001", tax_point: "JFK", original_amount: 100 }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100 }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched).toHaveLength(1);
      expect(result.mismatched[0].differences).toContainEqual(
        expect.objectContaining({ field_name: "tax_code", left_value: "  US  ", right_value: "US" })
      );
    });
  });

  describe("status", () => {
    it("returns PASS when no differences and no missing", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.status).toBe("PASS");
    });

    it("returns FAIL when there are mismatches", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 100 }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_amount: 200 }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.status).toBe("FAIL");
    });
  });

  describe("all compared fields", () => {
    it("compares sale_amount with tolerance", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", sale_amount: 95 }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", sale_amount: 95.009 }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.matched).toHaveLength(1);
    });

    it("compares sale_currency", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", sale_currency: "USD" }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", sale_currency: "EUR" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched[0].differences).toContainEqual(
        expect.objectContaining({ field_name: "sale_currency" })
      );
    });

    it("compares reference_id", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", reference_id: "1" }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", reference_id: "2" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched[0].differences).toContainEqual(
        expect.objectContaining({ field_name: "reference_id" })
      );
    });

    it("compares tax_point_tag", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", tax_point_tag: "P" }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", tax_point_tag: "D" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched[0].differences).toContainEqual(
        expect.objectContaining({ field_name: "tax_point_tag" })
      );
    });

    it("compares original_currency", () => {
      const left = makeResponse([
        makeQpx({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_currency: "USD" }),
      ]);
      const right = makeResponse([
        makeTango({ tax_code: "US", tax_type: "001", tax_point: "JFK", original_currency: "GBP" }),
      ]);

      const result = compareParsedResponses(left, right);

      expect(result.mismatched[0].differences).toContainEqual(
        expect.objectContaining({ field_name: "original_currency" })
      );
    });
  });
});
