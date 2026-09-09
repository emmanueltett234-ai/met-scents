"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_SOURCE_LABELS } from "@/types";

export function EnquiryFilters({ products }: { products: { id: string; brand: string; name: string }[] }) {
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
    params.delete("page"); // any filter change resets pagination
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
          placeholder="Search name, WhatsApp, email, product, or enquiry ID…"
          className="w-full border border-border bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ink"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className={selectClass}
          value={searchParams.get("status") ?? ""}
          onChange={(e) => updateParams({ status: e.target.value || null })}
        >
          <option value="">All Statuses</option>
          {Object.entries(ENQUIRY_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={searchParams.get("source") ?? ""}
          onChange={(e) => updateParams({ source: e.target.value || null })}
        >
          <option value="">All Sources</option>
          {Object.entries(ENQUIRY_SOURCE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={searchParams.get("whatsapp_opened") ?? ""}
          onChange={(e) => updateParams({ whatsapp_opened: e.target.value || null })}
        >
          <option value="">WhatsApp: Any</option>
          <option value="true">WhatsApp Opened</option>
          <option value="false">Not Opened</option>
        </select>

        <select
          className={selectClass}
          value={searchParams.get("product") ?? ""}
          onChange={(e) => updateParams({ product: e.target.value || null })}
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.brand} - {p.name}</option>
          ))}
        </select>

        <input
          type="date"
          className={selectClass}
          value={searchParams.get("from") ?? ""}
          onChange={(e) => updateParams({ from: e.target.value || null })}
        />
        <span className="self-center text-xs text-muted-foreground">to</span>
        <input
          type="date"
          className={selectClass}
          value={searchParams.get("to") ?? ""}
          onChange={(e) => updateParams({ to: e.target.value || null })}
        />

        <select
          className={selectClass}
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => updateParams({ sort: e.target.value })}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="value_desc">Highest Value</option>
          <option value="value_asc">Lowest Value</option>
        </select>
      </div>
    </div>
  );
}
