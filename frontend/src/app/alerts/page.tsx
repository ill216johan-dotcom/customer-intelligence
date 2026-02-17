"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Bell, Filter, CheckCircle2, ShieldAlert } from "lucide-react";

import { mockAlerts } from "@/lib/mock-data";
import { Alert, AlertSeverity, AlertType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge, SeverityBadge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type SeverityFilter = "all" | AlertSeverity;
type TypeFilter = "all" | AlertType;
type StatusFilter = "all" | "unread" | "unresolved";

const typeLabels: Record<AlertType, string> = {
  payment_overdue: "Просрочка оплаты",
  potential_leave: "Риск ухода",
  high_reserves: "Высокие резервы",
  custom: "Пользовательский",
};

const severityCardStyles: Record<AlertSeverity, string> = {
  critical: "border-l-4 border-red-500 bg-red-50/70",
  high: "border-l-4 border-orange-500 bg-orange-50/70",
  medium: "border-l-4 border-amber-500 bg-amber-50/70",
  low: "border-l-4 border-sky-500 bg-sky-50/70",
};

function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMMM yyyy, HH:mm", { locale: ru });
}

export default function AlertsPage() {
  const { addToast } = useToast();

  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    if (selectedAlert) {
      setResolutionNote(selectedAlert.resolution_note ?? "");
    }
  }, [selectedAlert]);

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.is_read).length,
    [alerts]
  );

  const unresolvedCount = useMemo(
    () => alerts.filter((alert) => !alert.is_resolved).length,
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
      if (typeFilter !== "all" && alert.type !== typeFilter) return false;
      if (statusFilter === "unread" && alert.is_read) return false;
      if (statusFilter === "unresolved" && alert.is_resolved) return false;
      return true;
    });
  }, [alerts, severityFilter, typeFilter, statusFilter]);

  const markAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? { ...alert, is_read: true, read_at: new Date().toISOString() }
          : alert
      )
    );
    addToast({
      title: "Отмечено как прочитанное",
      description: "Алерт отмечен прочитанным",
      variant: "success",
    });
  };

  const resolveAlert = (alertId: string, note?: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              is_resolved: true,
              resolution_note: note || "Решено вручную",
              resolved_at: new Date().toISOString(),
              is_read: true,
              read_at: alert.read_at || new Date().toISOString(),
            }
          : alert
      )
    );
    addToast({
      title: "Алерт решён",
      description: "Статус алерта обновлён",
      variant: "success",
    });
  };

  const openDetail = (alert: Alert) => {
    setSelectedAlert(alert);
    setDetailOpen(true);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Алерты</h1>
          <p className="text-muted-foreground">
            {unreadCount} непрочитанных · {unresolvedCount} нерешённых
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Фильтры
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Все уровни</option>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
            <option value="critical">Критический</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Все типы</option>
            <option value="payment_overdue">Просрочка оплаты</option>
            <option value="potential_leave">Риск ухода</option>
            <option value="high_reserves">Высокие резервы</option>
            <option value="custom">Пользовательский</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Все статусы</option>
            <option value="unread">Непрочитанные</option>
            <option value="unresolved">Нерешённые</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => openDetail(alert)}
            className={cn(
              "rounded-2xl border border-border p-5 bg-card transition-all cursor-pointer hover:shadow-md",
              severityCardStyles[alert.severity]
            )}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={alert.severity} size="sm" />
                  <Badge variant="outline" size="sm">
                    {typeLabels[alert.type]}
                  </Badge>
                  {!alert.is_read && (
                    <Badge variant="warning" size="sm">
                      Непрочитан
                    </Badge>
                  )}
                  {alert.is_resolved && (
                    <Badge variant="success" size="sm">
                      Решён
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {alert.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {alert.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {alert.customer_name ?? "Без клиента"} · {formatDateTime(alert.created_at)}
                </p>
              </div>

              <div className="flex flex-row md:flex-col gap-2">
                {!alert.is_read && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(alert.id);
                    }}
                  >
                    Прочитано
                  </Button>
                )}
                {!alert.is_resolved && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resolveAlert(alert.id);
                    }}
                  >
                    Решить
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            Нет алертов по выбранным фильтрам
          </div>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAlert.title}</DialogTitle>
                <DialogDescription>
                  {selectedAlert.customer_name ?? "Без клиента"} · {" "}
                  {formatDateTime(selectedAlert.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={selectedAlert.severity} size="sm" />
                  <Badge variant="outline" size="sm">
                    {typeLabels[selectedAlert.type]}
                  </Badge>
                  {selectedAlert.is_resolved ? (
                    <Badge variant="success" size="sm">
                      Решён
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Открыт
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedAlert.message}
                </p>

                {selectedAlert.trigger_data && (
                  <div className="rounded-lg border border-border bg-secondary/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Данные триггера
                    </p>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(selectedAlert.trigger_data, null, 2)}
                    </pre>
                  </div>
                )}

                {!selectedAlert.is_resolved && (
                  <Textarea
                    label="Комментарий к решению"
                    placeholder="Опишите, как был решён алерт"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={4}
                  />
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Закрыть
                </Button>
                {!selectedAlert.is_resolved && (
                  <Button
                    onClick={() => {
                      resolveAlert(selectedAlert.id, resolutionNote);
                      setDetailOpen(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Решить
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
