import { forwardRef, useState, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, action, fullWidth = true, className = "", id, maxLength, onChange, value, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    // Works for controlled and uncontrolled usage without a syncing effect.
    const [typed, setTyped] = useState("");
    const text = typeof value === "string" ? value : typed;
    const showCount = typeof maxLength === "number" && !error;
    const atLimit = typeof maxLength === "number" && text.length >= maxLength;
    const countId = `${inputId}-count`;

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
            maxLength={maxLength}
            value={value}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : showCount ? countId : undefined
            }
            onChange={(event) => {
              setTyped(event.currentTarget.value);
              onChange?.(event);
            }}
            className={[
              "h-11 w-full rounded-[var(--radius-xs)] border bg-surface-raised px-3 text-base text-text-primary placeholder:text-gray-500 sm:text-sm",
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
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-status-error" role="alert">
            {error}
          </p>
        ) : (
          showCount && (
            <p
              id={countId}
              className={`mt-1 text-right text-[11px] tabular-nums ${
                atLimit ? "text-accent" : "text-text-tertiary/60"
              }`}
            >
              {text.length}/{maxLength}
            </p>
          )
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
