import { describe, expect, it } from "vitest";
import { gregorianIso, isLeapJalali, jalaliMonthLength, toJalali } from "./jalali";

describe("jalali", () => {
  it("converts known new year dates", () => {
    expect(gregorianIso(1393, 1, 1)).toBe("2014-03-21");
    expect(gregorianIso(1403, 12, 30)).toBe("2025-03-20");
    expect(gregorianIso(1404, 1, 1)).toBe("2025-03-21");
    expect(toJalali(2026, 11, 3)).toEqual({ jy: 1405, jm: 8, jd: 12 });
  });

  it("knows leap esfand", () => {
    expect(isLeapJalali(1403)).toBe(true);
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(jalaliMonthLength(1404, 12)).toBe(29);
  });
});
