import { cva } from "class-variance-authority";
import { cn } from "@shared/lib/cn";

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 text-sm [&_svg]:absolute [&_svg]:left-4 [&_svg]:top-4 [&_svg+div]:translate-y-[-2px] [&_svg~*]:pl-7",
  {
    variants: {
      variant: {
        default:
          "border-border bg-secondary/55 text-secondary-foreground shadow-[0_1px_3px_hsl(var(--shadow-color)/0.12)]",
        destructive:
          "border-destructive/35 bg-destructive/10 text-destructive [&_svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({ className, variant, ...props }) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }) {
  return (
    <h5
      data-slot="alert-title"
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
