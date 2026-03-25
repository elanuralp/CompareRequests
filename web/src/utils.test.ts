import { describe, it, expect } from "vitest";
import { normalizeText, getNested, safeDecimal } from "./lib/utils";

describe("normalizeText", () => {
  it("returns null for null", () => {
    expect(normalizeText(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(normalizeText(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeText("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(normalizeText("   ")).toBeNull();
  });

  it("trims and returns normal string", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("returns string for number", () => {
    expect(normalizeText(123)).toBe("123");
  });
});

describe("getNested", () => {
  const data = {
    a: {
      b: {
        c: "value",
      },
      d: null,
    },
    e: "top",
  };

  it("returns nested value for valid path", () => {
    expect(getNested(data, "a.b.c")).toBe("value");
  });

  it("returns null for missing intermediate key", () => {
    expect(getNested(data, "a.x.c")).toBeNull();
  });

  it("returns null for missing top-level key", () => {
    expect(getNested(data, "z")).toBeNull();
  });

  it("returns null for null in path", () => {
    expect(getNested(data, "a.d.c")).toBeNull();
  });

  it("returns top-level value", () => {
    expect(getNested(data, "e")).toBe("top");
  });
});

describe("safeDecimal", () => {
  it("returns null for null", () => {
    expect(safeDecimal(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(safeDecimal(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safeDecimal("")).toBeNull();
  });

  it("returns null for whitespace string", () => {
    expect(safeDecimal("   ")).toBeNull();
  });

  it("returns null for non-numeric string", () => {
    expect(safeDecimal("abc")).toBeNull();
  });

  it("parses integer string", () => {
    expect(safeDecimal("42")).toBe(42);
  });

  it("parses decimal string", () => {
    expect(safeDecimal("12.34")).toBe(12.34);
  });

  it("parses number", () => {
    expect(safeDecimal(99.5)).toBe(99.5);
  });

  it("trims string before parsing", () => {
    expect(safeDecimal("  7.5  ")).toBe(7.5);
  });

  it("handles negative numbers", () => {
    expect(safeDecimal("-10.5")).toBe(-10.5);
  });
});
