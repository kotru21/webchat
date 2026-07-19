import { cn } from "@shared/lib/cn";

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-2xl border border-input bg-card/80 px-4 py-3 text-sm shadow-[inset_0_1px_0_hsl(var(--background)/0.5)] transition-[color,box-shadow,border-color,background-color] duration-200 placeholder:text-foreground/55 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-55",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
