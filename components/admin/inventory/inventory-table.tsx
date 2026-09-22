import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatGHS } from "@/lib/currency";
import { INVENTORY_STATUS_LABELS, type InventoryStatus } from "@/types";

export interface InventoryRow {
  productId: string;
  brand: string;
  name: string;
  imageUrl: string | null;
  typeName: string | null;
  tracked: boolean;
  initialMl?: number;
  currentMl?: number;
  decantsSold?: number;
  fullDecants?: number;
  leftoverMl?: number;
  costPerDecant?: number;
  sellingPricePerDecant?: number;
  profitPerDecant?: number;
  status?: InventoryStatus;
}

const STATUS_BADGE_VARIANT: Record<InventoryStatus, "success" | "warning" | "destructive"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "destructive",
};

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Perfume</TableHead>
          <TableHead>Initial ML</TableHead>
          <TableHead>Remaining ML</TableHead>
          <TableHead>Sold</TableHead>
          <TableHead>Cost/Decant</TableHead>
          <TableHead>Selling Price</TableHead>
          <TableHead>Profit/Decant</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.productId} className="cursor-pointer">
            <TableCell>
              <Link href={`/admin/inventory/${r.productId}`} className="font-medium hover:text-accent-dark">
                <p className="text-xs text-muted-foreground">{r.brand}</p>
                <p className="font-serif text-base">{r.name}</p>
              </Link>
            </TableCell>
            {!r.tracked ? (
              <TableCell colSpan={6} className="text-xs text-muted-foreground">
                Not tracked yet —{" "}
                <Link href={`/admin/inventory/${r.productId}`} className="underline hover:text-ink">
                  set up inventory
                </Link>
              </TableCell>
            ) : (
              <>
                <TableCell className="text-sm">{r.initialMl?.toLocaleString()}ml</TableCell>
                <TableCell className="text-sm">
                  {r.currentMl?.toLocaleString()}ml
                  <p className="text-xs text-muted-foreground">
                    {r.fullDecants} decant{r.fullDecants === 1 ? "" : "s"}
                    {r.leftoverMl ? ` + ${r.leftoverMl}ml leftover` : ""}
                  </p>
                </TableCell>
                <TableCell className="text-sm">{r.decantsSold}</TableCell>
                <TableCell className="text-sm">{formatGHS(r.costPerDecant ?? 0)}</TableCell>
                <TableCell className="text-sm">{formatGHS(r.sellingPricePerDecant ?? 0)}</TableCell>
                <TableCell className={`text-sm ${(r.profitPerDecant ?? 0) < 0 ? "text-red-700" : ""}`}>
                  {formatGHS(r.profitPerDecant ?? 0)}
                </TableCell>
                <TableCell>
                  {r.status && <Badge variant={STATUS_BADGE_VARIANT[r.status]}>{INVENTORY_STATUS_LABELS[r.status]}</Badge>}
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
