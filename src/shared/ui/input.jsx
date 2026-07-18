import { forwardRef } from "react";
import { cn } from "@shared/lib/cn";

const Input = forwardRef(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      data-slot="input"
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-input bg-card/80 px-4 py-2 text-sm shadow-[inset_0_1px_0_hsl(var(--background)/0.5)] transition-[color,box-shadow,border-color,background-color] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/90 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-55",
        className
      )}
      {...props}
    />
  );
});

export { Input };
