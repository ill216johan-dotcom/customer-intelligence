"use client";

import { Sidebar } from "./sidebar";
import { ToastProvider } from "./ui/toast";
import { DataStoreProvider } from "@/lib/data-store";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataStoreProvider>
      <ToastProvider>
        <Sidebar />
        <main className="ml-60 min-h-screen">
          {children}
        </main>
      </ToastProvider>
    </DataStoreProvider>
  );
}
