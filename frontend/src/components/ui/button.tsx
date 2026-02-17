"use client";

/**
 * Button component with variants and sizes
 * Supports loading state with spinner
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

// ==========================================
// Types
// ==========================================

type ButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
}

// ==========================================
// Variant Styles
// ==========================================

const variantStyles: Record<ButtonVariant, string> = {
  default: cn(
    "bg-blue-600 text-white",
    "hover:bg-blue-700",
    "focus-visible:ring-blue-500",
    "shadow-sm"
  ),
  secondary: cn(
    "bg-gray-100 text-gray-900",
    "hover:bg-gray-200",
    "focus-visible:ring-gray-500",
    "border border-gray-200"
  ),
  destructive: cn(
    "bg-red-600 text-white",
    "hover:bg-red-700",
    "focus-visible:ring-red-500",
    "shadow-sm"
  ),
  outline: cn(
    "bg-transparent text-gray-700",
    "hover:bg-gray-100",
    "focus-visible:ring-gray-500",
    "border border-gray-300"
  ),
  ghost: cn(
    "bg-transparent text-gray-700",
    "hover:bg-gray-100",
    "focus-visible:ring-gray-500"
  ),
  link: cn(
    "bg-transparent text-blue-600",
    "hover:text-blue-700 hover:underline",
    "focus-visible:ring-blue-500",
    "underline-offset-4"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-6 text-base rounded-lg gap-2.5",
  icon: "h-10 w-10 rounded-lg",
};

// ==========================================
// Spinner Component
// ==========================================

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ==========================================
// Button Component
// ==========================================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          // Loading state
          loading && "cursor-wait",
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Spinner
            className={cn(
              "shrink-0",
              size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
            )}
          />
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// ==========================================
// Icon Button Component
// ==========================================

interface IconButtonProps extends Omit<ButtonProps, "size"> {
  size?: "sm" | "md" | "lg";
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeMap = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    };

    return (
      <Button
        ref={ref}
        size="icon"
        className={cn(sizeMap[size], className)}
        {...props}
      />
    );
  }
);
IconButton.displayName = "IconButton";

// ==========================================
// Button Group Component
// ==========================================

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function ButtonGroup({ className, children, ...props }: ButtonGroupProps) {
  return (
    <div
      className={cn("inline-flex rounded-lg shadow-sm", className)}
      role="group"
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;

        return React.cloneElement(child as React.ReactElement<ButtonProps>, {
          className: cn(
            (child as React.ReactElement<ButtonProps>).props.className,
            "rounded-none",
            isFirst && "rounded-l-lg",
            isLast && "rounded-r-lg",
            !isFirst && "-ml-px"
          ),
        });
      })}
    </div>
  );
}

// ==========================================
// Exports
// ==========================================

export { Button, IconButton, ButtonGroup, Spinner };
export type { ButtonProps, ButtonVariant, ButtonSize };
