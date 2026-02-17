"use client";

/**
 * Tabs component using @radix-ui/react-tabs
 * Provides accessible tabbed interface with styling
 */

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

// ==========================================
// Root Component
// ==========================================

const Tabs = TabsPrimitive.Root;

// ==========================================
// List Component
// ==========================================

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "default" | "pills" | "underline";
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center",
      // Variant styles
      variant === "default" &&
        "h-10 rounded-lg bg-gray-100 p-1 text-gray-500",
      variant === "pills" && "gap-2",
      variant === "underline" &&
        "border-b border-gray-200 gap-4 pb-px",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// ==========================================
// Trigger Component
// ==========================================

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: "default" | "pills" | "underline";
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles
      "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Variant styles
      variant === "default" && [
        "rounded-md px-3 py-1.5 text-sm",
        "ring-offset-white",
        "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
      ],
      variant === "pills" && [
        "rounded-full px-4 py-2 text-sm",
        "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
      ],
      variant === "underline" && [
        "px-1 pb-3 text-sm -mb-px",
        "text-gray-500 hover:text-gray-900",
        "border-b-2 border-transparent",
        "data-[state=active]:border-blue-600 data-[state=active]:text-gray-900",
      ],
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// ==========================================
// Content Component
// ==========================================

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-white",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      // Animation
      "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-left-1",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// ==========================================
// Tab Panel (for adding padding/structure)
// ==========================================

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function TabPanel({ className, children, ...props }: TabPanelProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  );
}

// ==========================================
// Simple Tabs Component
// ==========================================

interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface SimpleTabsProps {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: "default" | "pills" | "underline";
  className?: string;
  listClassName?: string;
  contentClassName?: string;
}

function SimpleTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  variant = "default",
  className,
  listClassName,
  contentClassName,
}: SimpleTabsProps) {
  const defaultTab = defaultValue || tabs[0]?.value;

  return (
    <Tabs
      defaultValue={defaultTab}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList variant={variant} className={listClassName}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            variant={variant}
            disabled={tab.disabled}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className={contentClassName}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

// ==========================================
// Exports
// ==========================================

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabPanel,
  SimpleTabs,
};
export type { TabsListProps, TabsTriggerProps, Tab, SimpleTabsProps };
