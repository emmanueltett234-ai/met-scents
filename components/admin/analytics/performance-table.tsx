import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export interface PerformanceColumn<T> {
  label: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
}

export function PerformanceTable<T extends { productId?: string | null; size?: string }>({
  rows,
  columns,
  emptyMessage,
  keyField,
}: {
  rows: T[];
  columns: PerformanceColumn<T>[];
  emptyMessage: string;
  keyField: (row: T, i: number) => string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((c) => (
            <TableHead key={c.label} className={c.align === "right" ? "text-right" : ""}>{c.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={keyField(row, i)}>
            {columns.map((c) => (
              <TableCell key={c.label} className={c.align === "right" ? "text-right" : ""}>{c.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
