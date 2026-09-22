"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { INVENTORY_STATUS_LABELS } from "@/types";

export function InventoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) updateParams({ search: search || null });
    }, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const selectClass = "min-w-0 border border-border bg-white px-3 py-2 text-xs";

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brand or perfume name…"
          className="w-full border border-border bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ink"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select className={selectClass} value={searchParams.get("status") ?? ""} onChange={(e) => updateParams({ status: e.target.value || null })}>
          <option value="">All Statuses</option>
          {Object.entries(INVENTORY_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          <option value="not_tracked">Not Tracked Yet</option>
        </select>

        <select className={selectClass} value={searchParams.get("sort") ?? "brand_asc"} onChange={(e) => updateParams({ sort: e.target.value })}>
          <option value="brand_asc">Brand / Name</option>
          <option value="remaining_asc">Lowest Remaining ML</option>
          <option value="remaining_desc">Highest Remaining ML</option>
          <option value="profit_desc">Highest Profit/Decant</option>
        </select>
      </div>
    </div>
  );
}
