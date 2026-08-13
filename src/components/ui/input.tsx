import * as React from "react";
import { cn } from "@/components/ui/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-8 w-full rounded-ctl border border-line bg-bg-1 px-3 py-1.5 font-mono text-[13px] text-tx-1 placeholder:text-tx-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
