"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        enabled ? "bg-primary" : "bg-gray-300"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

export default function SettingsPage() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const connections = [
    {
      name: "Backend API",
      status: "disconnected",
      description: "Доступ к данным клиентов и коммуникаций",
    },
    {
      name: "Telegram Bot",
      status: "disconnected",
      description: "Синхронизация чатов и уведомлений",
    },
    {
      name: "Bitrix24",
      status: "disconnected",
      description: "Импорт клиентов и звонков",
    },
    {
      name: "WMS",
      status: "disconnected",
      description: "Складские статусы и отгрузки",
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Настройки</h1>
        <p className="text-muted-foreground mt-1">
          Управляйте профилем и подключениями
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-lg font-bold">
            A
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">Администратор</p>
            <p className="text-sm text-muted-foreground">admin@example.com</p>
            <Badge variant="secondary" size="sm">
              Админ
            </Badge>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Уведомления</h2>
          <ToggleRow
            title="Email уведомления"
            description="Получать сводки и алерты на почту"
            enabled={emailEnabled}
            onToggle={() => setEmailEnabled((prev) => !prev)}
          />
          <ToggleRow
            title="Telegram уведомления"
            description="Дублировать алерты в Telegram"
            enabled={telegramEnabled}
            onToggle={() => setTelegramEnabled((prev) => !prev)}
          />
          <ToggleRow
            title="Звуковые уведомления"
            description="Проигрывать звук при новых алертах"
            enabled={soundEnabled}
            onToggle={() => setSoundEnabled((prev) => !prev)}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">API Подключения</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((connection) => {
              const isConnected = connection.status === "connected";
              return (
                <div
                  key={connection.name}
                  className="rounded-xl border border-border p-4 bg-secondary/30"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {connection.name}
                    </p>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isConnected ? "bg-emerald-500" : "bg-red-500"
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {connection.description}
                  </p>
                  <Badge
                    variant={isConnected ? "success" : "destructive"}
                    size="sm"
                    className="mt-3"
                  >
                    {isConnected ? "Подключено" : "Не подключено"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground">О системе</h2>
          <p className="text-sm text-muted-foreground">
            Версия: <span className="text-foreground font-medium">0.1.0</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Сборка: <span className="text-foreground font-medium">17 февраля 2026</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Среда: <span className="text-foreground font-medium">Localhost</span>
          </p>
        </div>
      </div>
    </div>
  );
}
