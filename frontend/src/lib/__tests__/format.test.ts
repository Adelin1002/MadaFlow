import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatRelativeDate, formatFullDate } from "../format";

const NOW = new Date("2026-06-15T12:00:00.000Z");

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats a few minutes ago", () => {
    const tenMinutesAgo = new Date(NOW.getTime() - 10 * 60 * 1000).toISOString();
    expect(formatRelativeDate(tenMinutesAgo)).toBe("il y a 10 minutes");
  });

  it("formats a few hours ago", () => {
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(threeHoursAgo)).toBe("il y a 3 heures");
  });

  it("formats a few days ago", () => {
    const twoDaysAgo = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(twoDaysAgo)).toBe("avant-hier");
  });

  it("formats a future date", () => {
    const inTwoHours = new Date(NOW.getTime() + 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(inTwoHours)).toBe("dans 2 heures");
  });

  it("formats a date from just now", () => {
    expect(formatRelativeDate(NOW.toISOString())).toBe("maintenant");
  });
});

describe("formatFullDate", () => {
  it("includes the year, so it's never ambiguous", () => {
    const result = formatFullDate("2026-03-05T09:30:00.000Z");
    expect(result).toContain("2026");
  });
});
