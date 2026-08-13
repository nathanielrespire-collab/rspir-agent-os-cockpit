import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/ui/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-ctl px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none",
  {
    variants: {
      variant: {
        default: "bg-bg-2 text-tx-2 border border-line",
        ok: "bg-ok/15 text-ok border border-ok/30",
        warn: "bg-warn/15 text-warn border border-warn/30",
        err: "bg-err/15 text-err border border-err/30",
        info: "bg-info/15 text-info border border-info/30",
        or: "bg-or/15 text-or border border-or/30",
        laiton: "bg-laiton/15 text-laiton border border-laiton/30",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
