"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Mic,
  Plus,
  Sparkles,
  MessageSquare,
  Phone,
  Bell,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

import type { Activity } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge, SeverityBadge } from "@/components/ui/badge";
import { useDataStore } from "@/lib/data-store";

// ==========================================
// Helpers
// ==========================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

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
// Main Dashboard
// ==========================================

export default function Home() {
  const { addToast } = useToast();
  const {
    activities,
    addActivity,
    addNote,
    alerts,
    markAlertRead,
    customers,
  } = useDataStore();

  // ------ Search ------
  const [searchQuery, setSearchQuery] = useState("");

  // ------ Drag & Drop ------
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);

  // ------ Dialogs ------
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // ------ Note form ------
  const [noteCustomerId, setNoteCustomerId] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // ------ Upload form ------
  const [uploadCustomerId, setUploadCustomerId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFilename, setUploadFilename] = useState("");

  // ------ Derived data ------
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities;
    const q = searchQuery.toLowerCase();
    return activities.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [activities, searchQuery]);

  const unresolvedAlerts = useMemo(
    () => alerts.filter((a) => !a.is_resolved && !a.is_read).slice(0, 3),
    [alerts]
  );

  // ------ Stats for insight card ------
  const totalCalls = activities.filter((a) => a.type === "call").length;
  const totalMessages = activities.filter((a) => a.type === "message").length;
  const totalNotes = activities.filter((a) => a.type === "note").length;
  const totalCustomers = customers.length;

  // ------ Handlers ------
  const handleMarkAlertRead = useCallback(
    (alertId: string) => {
      markAlertRead(alertId);
      addToast({
        title: "Отмечено как прочитанное",
        description: "Алерт убран из рекомендаций",
        variant: "success",
      });
    },
    [addToast, markAlertRead]
  );

  const handleSaveNote = useCallback(() => {
    if (!noteCustomerId || !noteContent.trim()) {
      addToast({
        title: "Ошибка",
        description: "Выберите клиента и введите текст заметки",
        variant: "error",
      });
      return;
    }

    const customer = customers.find((c) => c.id === noteCustomerId);
    const newNote = {
      id: crypto.randomUUID(),
      customer_id: noteCustomerId,
      author_id: null,
      author_name: "Администратор",
      content: noteContent.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addNote(newNote);
    setNoteDialogOpen(false);
    setNoteCustomerId("");
    setNoteContent("");
    addToast({
      title: "Заметка сохранена",
      description: `Заметка для ${customer?.name ?? "клиента"} добавлена`,
      variant: "success",
    });
  }, [noteCustomerId, noteContent, customers, addNote, addToast]);

  const handleSaveUpload = useCallback(() => {
    if (!uploadCustomerId || !uploadTitle.trim()) {
      addToast({
        title: "Ошибка",
        description: "Выберите клиента и введите название звонка",
        variant: "error",
      });
      return;
    }

    const customer = customers.find((c) => c.id === uploadCustomerId);
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      type: "call",
      title: uploadTitle.trim(),
      description: uploadFilename
        ? `Загружен файл: ${uploadFilename}`
        : "Звонок добавлен вручную",
      timestamp: new Date().toISOString(),
      customer_id: uploadCustomerId,
      customer_name: customer?.name,
      metadata: { source: "manual", filename: uploadFilename || undefined },
    };

    addActivity(newActivity);
    setUploadDialogOpen(false);
    setUploadCustomerId("");
    setUploadTitle("");
    setUploadFilename("");
    addToast({
      title: "Звонок загружен",
      description: `Звонок "${newActivity.title}" добавлен`,
      variant: "success",
    });
  }, [uploadCustomerId, uploadTitle, uploadFilename, customers, addActivity, addToast]);

  const handleActivityClick = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
    setDetailDialogOpen(true);
  }, []);

  // ------ Drag & Drop handlers ------
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setDraggedFile(files[0]);
      setUploadFilename(files[0].name);
      setUploadDialogOpen(true);
    }
  }, []);

  const removeDraggedFile = useCallback(() => {
    setDraggedFile(null);
    setUploadFilename("");
  }, []);

  // ------ Alert severity → color map ------
  const alertColorMap: Record<string, { bg: string; border: string; dot: string; title: string; desc: string }> = {
    critical: {
      bg: "bg-red-50/80",
      border: "border-red-100",
      dot: "bg-red-500",
      title: "text-red-900",
      desc: "text-red-700",
    },
    high: {
      bg: "bg-red-50/80",
      border: "border-red-100",
      dot: "bg-red-500",
      title: "text-red-900",
      desc: "text-red-700",
    },
    medium: {
      bg: "bg-amber-50/80",
      border: "border-amber-100",
      dot: "bg-amber-500",
      title: "text-amber-900",
      desc: "text-amber-700",
    },
    low: {
      bg: "bg-yellow-50/80",
      border: "border-yellow-100",
      dot: "bg-yellow-500",
      title: "text-yellow-900",
      desc: "text-yellow-700",
    },
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div
      className="px-6 py-5 max-w-5xl mx-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ===== Drag & Drop Overlay ===== */}
      {isDragging && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Перетащите файл сюда</p>
            <p className="text-sm text-muted-foreground">
              Загрузите звонок или документ для обработки
            </p>
          </div>
        </div>
      )}

      {/* ===== Dragged File Banner ===== */}
      {draggedFile && (
        <div className="mb-4 p-3 bg-secondary border border-border rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-tertiary flex items-center justify-center">
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{draggedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(draggedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={removeDraggedFile}
            className="p-1 hover:bg-tertiary rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* ===== Header ===== */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {getGreeting()}, Админ
          </h1>
          <p className="text-muted-foreground text-sm">
            Вот что произошло с вашими клиентами сегодня.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNoteDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-85 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Заметка</span>
          </button>
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground rounded-md text-sm font-medium hover:bg-tertiary transition-colors"
          >
            <Mic className="w-4 h-4" />
            <span>Загрузить</span>
          </button>
        </div>
      </div>

      {/* ===== Search Bar ===== */}
      <div className="relative mb-8 max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по активностям..."
          className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring/50 placeholder:text-muted-foreground"
        />
      </div>

      {/* ===== Grid Content ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- Activities (left 2 cols) --- */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Последние активности
            </h2>
            {searchQuery && (
              <span className="text-xs text-muted-foreground">
                {filteredActivities.length} найдено
              </span>
            )}
          </div>

          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                  className="flex gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
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
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{formatTimestamp(activity.timestamp)}</span>
                      {activity.customer_name && (
                        <>
                          <span>·</span>
                          <span>{activity.customer_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Source Card */}
            <div
              onClick={() => setUploadDialogOpen(true)}
              className="flex items-center justify-center gap-3 p-4 rounded-lg border border-dashed border-border hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Добавить источник</span>
            </div>
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Ничего не найдено</p>
            </div>
          )}
        </div>

        {/* --- Right Sidebar --- */}
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Рекомендованные действия
          </h2>

          <div className="space-y-2">
            {unresolvedAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                Нет активных алертов
              </p>
            )}
            {unresolvedAlerts.map((alert) => {
              const colors = alertColorMap[alert.severity] ?? alertColorMap.medium;
              return (
                <div
                  key={alert.id}
                  onClick={() => handleMarkAlertRead(alert.id)}
                  className={`p-3.5 rounded-lg border ${colors.border} ${colors.bg} hover:brightness-95 transition-colors cursor-pointer`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-1.5 h-1.5 mt-1.5 rounded-full ${colors.dot} shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-xs font-semibold ${colors.title} truncate`}>
                          {alert.title}
                        </p>
                        <SeverityBadge severity={alert.severity} size="sm" />
                      </div>
                      <p className={`text-xs ${colors.desc} line-clamp-2 leading-relaxed`}>
                        {alert.message}
                      </p>
                      {alert.customer_name && (
                        <p className={`text-xs ${colors.desc} mt-1.5 opacity-75`}>
                          {alert.customer_name} · {formatTimestamp(alert.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insight Card */}
          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Инсайт дня
              </span>
            </div>
            <h3 className="font-medium text-base mb-2">
              {totalCustomers} клиентов в базе
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Звонков: {totalCalls} · Сообщений: {totalMessages} · Заметок: {totalNotes}
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary text-secondary-foreground w-fit px-3 py-1.5 rounded-md cursor-pointer hover:bg-tertiary transition-colors">
              Открыть отчет →
            </div>
          </div>
        </div>
      </div>

      {/* ===== Note Creation Dialog ===== */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая заметка</DialogTitle>
            <DialogDescription>
              Добавьте заметку к профилю клиента
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="w-full">
              <label className="block text-sm font-medium mb-1.5">
                Клиент
              </label>
              <select
                value={noteCustomerId}
                onChange={(e) => setNoteCustomerId(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring/50"
              >
                <option value="">Выберите клиента...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` (${c.company})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              label="Содержание заметки"
              placeholder="Введите текст заметки..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={5}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveNote}>
              <FileText className="w-4 h-4" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Upload Call Dialog ===== */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить звонок</DialogTitle>
            <DialogDescription>
              Загрузите аудиозапись звонка для транскрипции и анализа
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="w-full">
              <label className="block text-sm font-medium mb-1.5">
                Клиент
              </label>
              <select
                value={uploadCustomerId}
                onChange={(e) => setUploadCustomerId(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring/50"
              >
                <option value="">Выберите клиента...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` (${c.company})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Название звонка"
              placeholder="Например: Еженедельный созвон с клиентом"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />
            <div className="w-full">
              <label className="block text-sm font-medium mb-1.5">
                Аудиофайл
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {uploadFilename || "Выберите файл (.mp3, .wav, .ogg)"}
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setUploadFilename(file?.name ?? "");
                    }}
                  />
                </label>
                {uploadFilename && (
                  <button
                    type="button"
                    onClick={() => setUploadFilename("")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Убрать
                  </button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveUpload}>
              <Mic className="w-4 h-4" />
              Загрузить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Activity Detail Dialog ===== */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          {selectedActivity && (() => {
            const config = activityConfig[selectedActivity.type];
            const Icon = config.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center ${config.bg} ${config.text} shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge
                      className={`${config.badgeBg} ${config.badgeText} border-0`}
                    >
                      {config.label}
                    </Badge>
                  </div>
                  <DialogTitle>{selectedActivity.title}</DialogTitle>
                  <DialogDescription>
                    {selectedActivity.customer_name && (
                      <span className="font-medium">
                        {selectedActivity.customer_name}
                      </span>
                    )}
                    {selectedActivity.customer_name && " · "}
                    {formatTimestamp(selectedActivity.timestamp)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">
                      Описание
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedActivity.description}
                    </p>
                  </div>

                  {selectedActivity.metadata && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Детали
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedActivity.metadata).map(
                          ([key, value]) => (
                            <Badge key={key} variant="secondary" size="sm">
                              {key}: {String(value)}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    ID: {selectedActivity.id}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDetailDialogOpen(false)}
                  >
                    Закрыть
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
