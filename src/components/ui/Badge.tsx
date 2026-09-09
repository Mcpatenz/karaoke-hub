import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "error" | "live";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-strong text-text-tertiary border-border-default",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-status-success/10 text-status-success border-status-success/20",
  warning: "bg-status-warning/10 text-status-warning border-status-warning/20",
  error: "bg-status-error/10 text-status-error border-status-error/20",
  live: "bg-status-error/10 text-status-error border-status-error/20",
};

export default function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {variant === "live" && (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-error opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-status-error" />
        </span>
      )}
      {children}
    </span>
  );
}
