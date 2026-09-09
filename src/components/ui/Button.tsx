import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-text-inverse font-semibold shadow-[0_0_20px_var(--color-accent-glow)] hover:bg-accent-hover active:scale-[0.97]",
  secondary:
    "bg-white/[0.05] text-text-primary border border-white/[0.12] font-medium hover:bg-white/[0.1]",
  ghost:
    "bg-transparent text-text-tertiary font-medium hover:text-text-primary hover:bg-white/[0.06]",
  danger:
    "bg-status-error/10 text-status-error border border-status-error/20 font-medium hover:bg-status-error/20",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      size = "md",
      variant = "primary",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] transition-all duration-[var(--duration-instant)]",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "min-h-[44px] min-w-[44px]",
          sizeClasses[size],
          variantClasses[variant],
          fullWidth ? "w-full" : "",
          className,
        ].join(" ")}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
