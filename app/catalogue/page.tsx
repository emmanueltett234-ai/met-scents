import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterBar } from "@/components/catalogue/filter-bar";
import { ProductGrid } from "@/components/products/product-grid";
import { getAllBrands, getProducts, type ProductFilters } from "@/lib/data/products";
import { getActiveProductTypes } from "@/lib/data/product-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Browse the full Met Scents fragrance catalogue: men's, women's and unisex perfumes, decants and full bottles.",
};

interface CataloguePageProps {
  searchParams: {
    search?: string;
    brand?: string;
    gender?: string;
    category?: string;
    view?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const filters: ProductFilters = {
    search: searchParams.search,
    brand: searchParams.brand,
    gender: searchParams.gender,
    category: searchParams.category,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sort: (searchParams.sort as ProductFilters["sort"]) || "newest",
    view: searchParams.view as ProductFilters["view"],
  };

  const [products, brands, productTypes] = await Promise.all([
    getProducts(filters),
    getAllBrands(),
    getActiveProductTypes(),
  ]);

  return (
    <div className="container-luxe py-16">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl">Fragrance Catalogue</h1>
        <div className="divider-gold mx-auto mt-5" />
      </div>

      <Suspense fallback={null}>
        <FilterBar brands={brands} productTypes={productTypes} />
      </Suspense>

      <p className="mb-6 text-xs uppercase tracking-widest2 text-muted-foreground">
        {products.length} fragrance{products.length === 1 ? "" : "s"}
      </p>

      <ProductGrid products={products} />
    </div>
  );
}
