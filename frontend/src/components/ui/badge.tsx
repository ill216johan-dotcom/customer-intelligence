"use client";

/**
 * Badge component for status tags
 * Supports variants: default, secondary, destructive, outline, and custom colors
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ==========================================
// Types
// ==========================================

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

// ==========================================
// Variant Styles
// ==========================================

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-blue-100 text-blue-700 border-blue-200",
  secondary: "bg-gray-100 text-gray-700 border-gray-200",
  destructive: "bg-red-100 text-red-700 border-red-200",
  outline: "bg-transparent text-gray-700 border-gray-300",
  success: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-blue-500",
  secondary: "bg-gray-500",
  destructive: "bg-red-500",
  outline: "bg-gray-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  info: "bg-cyan-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

// ==========================================
// Badge Component
// ==========================================

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      dot = false,
      removable = false,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center gap-1 font-medium border rounded-full",
          "transition-colors duration-200",
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "shrink-0 rounded-full",
              size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
              dotColors[variant]
            )}
          />
        )}
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              "shrink-0 rounded-full p-0.5 -mr-0.5",
              "hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current",
              "transition-colors duration-200"
            )}
            aria-label="Remove"
          >
            <svg
              className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);
Badge.displayName = "Badge";

// ==========================================
// Status Badge Component
// ==========================================

type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "completed"
  | "error"
  | "warning";

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: StatusType;
}

const statusConfig: Record<StatusType, { variant: BadgeVariant; label: string }> = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
  pending: { variant: "warning", label: "Pending" },
  completed: { variant: "success", label: "Completed" },
  error: { variant: "destructive", label: "Error" },
  warning: { variant: "warning", label: "Warning" },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <Badge ref={ref} variant={config.variant} dot {...props}>
        {children || config.label}
      </Badge>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

// ==========================================
// Severity Badge Component (for Alerts)
// ==========================================

type SeverityType = "low" | "medium" | "high" | "critical";

interface SeverityBadgeProps extends Omit<BadgeProps, "variant"> {
  severity: SeverityType;
}

const severityConfig: Record<
  SeverityType,
  { variant: BadgeVariant; label: string }
> = {
  low: { variant: "info", label: "Low" },
  medium: { variant: "warning", label: "Medium" },
  high: { variant: "destructive", label: "High" },
  critical: { variant: "destructive", label: "Critical" },
};

const SeverityBadge = React.forwardRef<HTMLSpanElement, SeverityBadgeProps>(
  ({ severity, children, className, ...props }, ref) => {
    const config = severityConfig[severity];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        className={cn(
          severity === "critical" && "bg-red-600 text-white border-red-600",
          className
        )}
        {...props}
      >
        {children || config.label}
      </Badge>
    );
  }
);
SeverityBadge.displayName = "SeverityBadge";

// ==========================================
// Source Badge Component (for Calls/Messages)
// ==========================================

type SourceType = "telegram" | "email" | "whatsapp" | "bitrix" | "jitsi" | "manual";

interface SourceBadgeProps extends Omit<BadgeProps, "variant"> {
  source: SourceType;
}

const sourceConfig: Record<SourceType, { color: string; label: string }> = {
  telegram: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Telegram" },
  email: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Email" },
  whatsapp: { color: "bg-green-100 text-green-700 border-green-200", label: "WhatsApp" },
  bitrix: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "Bitrix" },
  jitsi: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "Jitsi" },
  manual: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Manual" },
};

const SourceBadge = React.forwardRef<HTMLSpanElement, SourceBadgeProps>(
  ({ source, children, className, size = "sm", ...props }, ref) => {
    const config = sourceConfig[source];

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium border rounded-full",
          config.color,
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children || config.label}
      </span>
    );
  }
);
SourceBadge.displayName = "SourceBadge";

// ==========================================
// Exports
// ==========================================

export {
  Badge,
  StatusBadge,
  SeverityBadge,
  SourceBadge,
};
export type {
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  StatusBadgeProps,
  StatusType,
  SeverityBadgeProps,
  SeverityType,
  SourceBadgeProps,
  SourceType,
};
