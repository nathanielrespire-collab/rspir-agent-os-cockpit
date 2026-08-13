import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/ui/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ctl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-or disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-or text-bg-0 hover:bg-or-hover",
        secondary: "bg-bg-2 text-tx-1 hover:bg-bg-2/80 border border-line",
        ghost: "hover:bg-bg-2 text-tx-2 hover:text-tx-1",
        destructive: "bg-err text-tx-1 hover:bg-err/90",
        outline: "border border-line bg-transparent hover:bg-bg-2 text-tx-1",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        sm: "h-7 px-2.5 text-xs",
        lg: "h-10 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
