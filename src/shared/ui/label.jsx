import { cn } from "@shared/lib/cn";

function Label({ className, ...props }) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none tracking-[0.01em] text-foreground/90 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}

export { Label };
