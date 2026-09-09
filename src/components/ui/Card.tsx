"use client";

import { forwardRef, type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "solid" | "glass";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { interactive = false, padding = "md", variant = "glass", className = "", children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={[
          "rounded-[var(--radius-sm)]",
          variant === "glass" ? "glass" : "border border-border-default bg-surface-raised",
          paddingClasses[padding],
          interactive
            ? "cursor-pointer transition-all duration-[var(--duration-instant)] hover:border-gray-600 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            : "",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
export default Card;
