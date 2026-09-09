import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, action, fullWidth = true, className = "", id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-medium text-text-tertiary"
        >
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
              aria-hidden="true"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={[
              "h-11 w-full rounded-[var(--radius-xs)] border bg-surface-raised px-3 text-sm text-text-primary placeholder:text-gray-500",
              "transition-all duration-[var(--duration-instant)]",
              "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-status-error focus:ring-status-error/30 focus:border-status-error"
                : "border-border-default hover:border-gray-600",
              Icon ? "pl-10" : "",
              action ? "pr-12" : "",
              className,
            ].join(" ")}
            {...props}
          />
          {action && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">{action}</div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-status-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
