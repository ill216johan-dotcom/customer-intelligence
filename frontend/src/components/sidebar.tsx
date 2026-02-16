import Link from "next/link";
import { 
  Users, 
  LayoutDashboard, 
  MessageSquare, 
  Settings,
  Bell,
  Search,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Главная", href: "/" },
  { icon: Users, label: "Клиенты", href: "/customers" },
  { icon: MessageSquare, label: "Чаты", href: "/chats" },
  { icon: Bell, label: "Алерты", href: "/alerts" },
  { icon: Settings, label: "Настройки", href: "/settings" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-64 border-r border-border bg-background/50 backdrop-blur-xl z-50 transition-all duration-300">
      <div className="flex flex-col h-full p-4">
        {/* Logo Area */}
        <div className="h-14 flex items-center gap-3 px-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="font-semibold text-lg tracking-tight hidden md:block">Customer Intel</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="font-medium hidden md:block">{item.label}</span>
              {/* Active Indicator (Mock) */}
              {item.href === "/" && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="mt-auto pt-4 border-t border-border">
          <button className="flex items-center gap-3 px-2 py-2 w-full rounded-xl hover:bg-accent transition-colors text-left group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-orange-400 border-2 border-background ring-2 ring-transparent group-hover:ring-accent transition-all shrink-0" />
            <div className="hidden md:block overflow-hidden">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@example.com</p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
