"use client";

/**
 * Input component with label and error state support
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ==========================================
// Types
// ==========================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ==========================================
// Input Component
// ==========================================

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium mb-1.5",
              hasError ? "text-red-600" : "text-gray-700",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              // Base styles
              "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm",
              "transition-colors duration-200",
              "placeholder:text-gray-400",
              // Focus styles
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              // Default border
              !hasError && "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20",
              // Error state
              hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              // Disabled state
              disabled && "cursor-not-allowed bg-gray-50 opacity-50",
              // Icon padding
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ==========================================
// Textarea Component
// ==========================================

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, disabled, id, ...props }, ref) => {
    const textareaId = id || React.useId();
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              "block text-sm font-medium mb-1.5",
              hasError ? "text-red-600" : "text-gray-700",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            // Base styles
            "flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm",
            "transition-colors duration-200",
            "placeholder:text-gray-400",
            "resize-y",
            // Focus styles
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            // Default border
            !hasError && "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20",
            // Error state
            hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            // Disabled state
            disabled && "cursor-not-allowed bg-gray-50 opacity-50",
            className
          )}
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ==========================================
// Search Input Component
// ==========================================

interface SearchInputProps extends Omit<InputProps, "leftIcon" | "type"> {
  onSearch?: (value: string) => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        onSearch(e.currentTarget.value);
      }
    };

    return (
      <Input
        ref={ref}
        type="search"
        className={className}
        leftIcon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";

// ==========================================
// Exports
// ==========================================

export { Input, Textarea, SearchInput };
export type { InputProps, TextareaProps, SearchInputProps };
