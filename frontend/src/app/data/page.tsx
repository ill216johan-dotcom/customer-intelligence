"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Search, Phone, MessageSquare, FileText, Bell, Filter } from "lucide-react";

import {
  mockActivities,
  mockCustomersListItems,
} from "@/lib/mock-data";
import type { Activity } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ==========================================
// Activity Config
// ==========================================

const activityConfig: Record<
  Activity["type"],
  {
    icon: typeof Phone;
    bg: string;
    text: string;
    label: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  call: {
    icon: Phone,
    bg: "bg-blue-50/80",
    text: "text-blue-600",
    label: "Звонок",
    badgeBg: "bg-blue-50/80",
    badgeText: "text-blue-700",
  },
  message: {
    icon: MessageSquare,
    bg: "bg-emerald-50/80",
    text: "text-emerald-600",
    label: "Сообщение",
    badgeBg: "bg-emerald-50/80",
    badgeText: "text-emerald-700",
  },
  alert: {
    icon: Bell,
    bg: "bg-amber-50/80",
    text: "text-amber-600",
    label: "Алерт",
    badgeBg: "bg-amber-50/80",
    badgeText: "text-amber-700",
  },
  note: {
    icon: FileText,
    bg: "bg-stone-100/80",
    text: "text-stone-600",
    label: "Заметка",
    badgeBg: "bg-stone-100/80",
    badgeText: "text-stone-700",
  },
};

function formatTimestamp(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { locale: ru, addSuffix: true });
  } catch {
    return iso;
  }
}

// ==========================================
// Data Page
// ==========================================

type FilterType = "all" | "calls" | "messages" | "alerts" | "notes";

export default function DataPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");

  // All activities sorted by date
  const allActivities = useMemo(
    () =>
      [...mockActivities].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    []
  );

  // Filter by type
  const typeFiltered = useMemo(() => {
    if (filterType === "all") return allActivities;
    return allActivities.filter((a) => a.type === filterType);
  }, [allActivities, filterType]);

  // Filter by customer
  const customerFiltered = useMemo(() => {
    if (selectedCustomerId === "all") return typeFiltered;
    return typeFiltered.filter((a) => a.customer_id === selectedCustomerId);
  }, [typeFiltered, selectedCustomerId]);

  // Filter by search
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return customerFiltered;
    const q = searchQuery.toLowerCase();
    return customerFiltered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.customer_name?.toLowerCase().includes(q)
    );
  }, [customerFiltered, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    all: allActivities.length,
    calls: allActivities.filter((a) => a.type === "call").length,
    messages: allActivities.filter((a) => a.type === "message").length,
    alerts: allActivities.filter((a) => a.type === "alert").length,
    notes: allActivities.filter((a) => a.type === "note").length,
  }), [allActivities]);

  return (
    <div className="px-6 py-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Данные</h1>
        <p className="text-sm text-muted-foreground">
          Все коммуникации и события по клиентам
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Type filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            {[
              { key: "all", label: "Все" },
              { key: "calls", label: "Звонки" },
              { key: "messages", label: "Сообщения" },
              { key: "alerts", label: "Алерты" },
              { key: "notes", label: "Заметки" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key as FilterType)}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  filterType === f.key
                    ? "bg-tertiary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {f.label}
                {f.key !== "all" && (
                  <span className="ml-1.5 text-xs opacity-60">
                    {stats[f.key as keyof typeof stats]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Customer filter */}
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring/50"
        >
          <option value="all">Все клиенты</option>
          {mockCustomersListItems.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, описанию, клиенту..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring/50 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Activities List */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-2">
          {filteredActivities.map((activity) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="flex gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.badgeBg} ${config.badgeText}`}>
                      {config.label}
                    </span>
                    <h3 className="font-medium text-sm truncate">
                      {activity.title}
                    </h3>
                    {activity.customer_name && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {activity.customer_name}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {activity.description}
                  </p>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-semibold">Ничего не найдено</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Попробуйте изменить фильтры или поисковый запрос
          </p>
        </div>
      )}
    </div>
  );
}
