"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses = {
  primary:
    "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm",
  secondary:
    "bg-secondary-600 hover:bg-secondary-700 active:bg-secondary-800 text-white shadow-sm",
  accent:
    "bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white shadow-sm",
  outline:
    "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100",
  ghost:
    "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
  danger:
    "bg-danger hover:bg-primary-700 active:bg-primary-800 text-white",
};

const sizeClasses = {
  sm: "text-sm px-3.5 py-1.5 rounded-md",
  md: "text-sm px-5 py-2.5 rounded-lg",
  lg: "text-base px-7 py-3.5 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-[0.97]",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
