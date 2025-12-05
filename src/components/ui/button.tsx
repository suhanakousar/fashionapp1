import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-opal-lavender disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-royal-plum to-midnight-indigo text-pearl-white shadow-lg hover:shadow-glow hover:scale-105",
        gold: "bg-gradient-to-r from-gold-soft to-gold-light text-midnight-indigo shadow-lg hover:shadow-glow-lg hover:scale-105",
        outline:
          "border-2 border-opal-lavender bg-transparent text-royal-plum hover:bg-opal-lavender/10 hover:scale-105",
        ghost:
          "hover:bg-opal-lavender/10 text-royal-plum hover:scale-105",
        glass:
          "glass text-royal-plum hover:bg-white/90 hover:scale-105",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

