"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENDER_LABELS } from "@/types";

const VIEW_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "decants", label: "Decants" },
  { value: "full-bottles", label: "Full Bottles" },
  { value: "new-arrivals", label: "New Arrivals" },
  { value: "best-sellers", label: "Best Sellers" },
];

const PRICE_OPTIONS = [
  { value: "any", label: "Any Price", min: undefined, max: undefined },
  { value: "u250", label: "Under GH₵250", min: undefined, max: 250 },
  { value: "250-350", label: "GH₵250 – GH₵350", min: 250, max: 350 },
  { value: "350-500", label: "GH₵350 – GH₵500", min: 350, max: 500 },
  { value: "o500", label: "Over GH₵500", min: 500, max: undefined },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popularity", label: "Popularity" },
];

export function FilterBar({ brands }: { brands: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [open, setOpen] = useState(false);

  function updateParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all" || value === "any") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handlePriceChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const opt = PRICE_OPTIONS.find((o) => o.value === value);
    params.delete("minPrice");
    params.delete("maxPrice");
    if (opt?.min !== undefined) params.set("minPrice", String(opt.min));
    if (opt?.max !== undefined) params.set("maxPrice", String(opt.max));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function clearAll() {
    startTransition(() => router.push(pathname));
    setSearch("");
  }

  const activeCount = ["gender", "brand", "view", "minPrice", "maxPrice", "search"].filter((k) =>
    searchParams.get(k)
  ).length;

  return (
    <div className="mb-10 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or brand…"
            className="pl-11"
          />
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters {activeCount > 0 && `(${activeCount})`}
        </Button>

        {activeCount > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="hidden sm:inline-flex">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${open ? "grid" : "hidden sm:grid"}`}>
        <Select value={searchParams.get("gender") ?? "all"} onValueChange={(v) => updateParam("gender", v)}>
          <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("brand") ?? "all"} onValueChange={(v) => updateParam("brand", v)}>
          <SelectTrigger><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("view") ?? "all"} onValueChange={(v) => updateParam("view", v)}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {VIEW_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={
            PRICE_OPTIONS.find(
              (o) =>
                String(o.min ?? "") === (searchParams.get("minPrice") ?? "") &&
                String(o.max ?? "") === (searchParams.get("maxPrice") ?? "")
            )?.value ?? "any"
          }
          onValueChange={handlePriceChange}
        >
          <SelectTrigger><SelectValue placeholder="Price" /></SelectTrigger>
          <SelectContent>
            {PRICE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end">
        <Select value={searchParams.get("sort") ?? "newest"} onValueChange={(v) => updateParam("sort", v)}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
