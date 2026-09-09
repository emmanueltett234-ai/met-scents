import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest2",
  {
    variants: {
      variant: {
        default: "border-ink/20 bg-ink text-cream",
        outline: "border-ink/30 text-ink bg-transparent",
        gold: "border-accent bg-accent/10 text-accent-dark",
        muted: "border-transparent bg-secondary text-muted-foreground",
        success: "border-transparent bg-accent/10 text-accent-dark",
        warning: "border-transparent bg-amber-100 text-amber-800",
        destructive: "border-transparent bg-red-100 text-red-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
