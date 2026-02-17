"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LayoutDashboard,
  Database,
  StickyNote,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Главная", href: "/" },
  { icon: Users, label: "Клиенты", href: "/customers" },
  { icon: Database, label: "Данные", href: "/data" },
  { icon: StickyNote, label: "Заметки", href: "/notes" },
  { icon: Search, label: "База знаний", href: "/knowledge" },
  { icon: Settings, label: "Настройки", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-secondary border-r border-border z-50">
      <div className="flex flex-col h-full py-3">
        {/* Logo */}
        <div className="px-3 mb-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-6 h-6 rounded flex items-center justify-center">
              <span className="font-semibold text-sm">C</span>
            </div>
            <span className="font-medium text-sm">
              Customer Intel
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-1.5 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                  isActive
                    ? "bg-tertiary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-tertiary/50 hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-6 h-6 rounded bg-tertiary flex items-center justify-center text-xs font-medium shrink-0">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">Администратор</p>
              <p className="text-xs text-muted-foreground truncate">
                admin@example.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
