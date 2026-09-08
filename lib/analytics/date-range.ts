// Date-range handling for the admin dashboard and analytics pages.
//
// Ghana runs on GMT (UTC+0) year-round — no daylight saving — so a Ghanaian
// calendar day boundary IS the UTC day boundary. That means every range
// below can be computed directly in UTC with no timezone conversion, and
// still be exactly correct for the shop owner's local "today".
export type DateRangeKey = "today" | "7d" | "30d" | "90d" | "ytd" | "custom";

export interface DateRange {
  key: DateRangeKey;
  /** Inclusive start, UTC. */
  from: Date;
  /** Exclusive end, UTC (so "today" is [start of today, start of tomorrow)). */
  to: Date;
  /** Suggested chart bucket size for this span. */
  granularity: "hour" | "day" | "week" | "month";
  label: string;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

export function resolveDateRange(
  key: DateRangeKey,
  customFrom?: string | null,
  customTo?: string | null
): DateRange {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  switch (key) {
    case "today":
      return { key, from: todayStart, to: tomorrowStart, granularity: "hour", label: "Today" };
    case "7d":
      return { key, from: addDays(todayStart, -6), to: tomorrowStart, granularity: "day", label: "Last 7 Days" };
    case "30d":
      return { key, from: addDays(todayStart, -29), to: tomorrowStart, granularity: "day", label: "Last 30 Days" };
    case "90d":
      return { key, from: addDays(todayStart, -89), to: tomorrowStart, granularity: "week", label: "Last 90 Days" };
    case "ytd":
      return {
        key,
        from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
        to: tomorrowStart,
        granularity: "month",
        label: "Year to Date",
      };
    case "custom": {
      const from = customFrom ? startOfUtcDay(new Date(customFrom)) : addDays(todayStart, -29);
      const toRaw = customTo ? startOfUtcDay(new Date(customTo)) : todayStart;
      const to = addDays(toRaw, 1); // make the end date inclusive
      const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
      const granularity = spanDays <= 2 ? "hour" : spanDays <= 45 ? "day" : spanDays <= 200 ? "week" : "month";
      return { key, from, to, granularity, label: "Custom Range" };
    }
  }
}

/** The immediately-preceding period of equal length, for period-over-period comparison. */
export function previousPeriod(range: DateRange): { from: Date; to: Date } {
  const spanMs = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - spanMs), to: new Date(range.from.getTime()) };
}

/** Percent change from `previous` to `current`, or null when it can't be meaningfully calculated. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : null; // never invent a % change from a zero baseline
  return ((current - previous) / previous) * 100;
}

export const DATE_RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "ytd", label: "Year to Date" },
  { key: "custom", label: "Custom" },
];
