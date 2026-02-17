"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Mic, MessageSquare, Phone, Upload, Clock, Filter } from "lucide-react";

import {
  mockCallsListItems,
  mockMessages,
  mockCustomersListItems,
} from "@/lib/mock-data";
import {
  CallListItem,
  CallSource,
  Message,
  MessageDirection,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge, SourceBadge, StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "completed" | "pending" | "failed";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}ч ${minutes}мин`;
  return `${minutes}мин`;
}

function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMMM yyyy, HH:mm", { locale: ru });
}

function getStatusLabel(status: string): string {
  if (status === "completed") return "Готов";
  if (status === "pending") return "В обработке";
  return "Ошибка";
}

function getStatusType(status: string): "completed" | "pending" | "error" {
  if (status === "completed") return "completed";
  if (status === "pending") return "pending";
  return "error";
}

export default function ChatsPage() {
  const { addToast } = useToast();

  const [calls, setCalls] = useState<CallListItem[]>(mockCallsListItems);
  const [messages] = useState<Message[]>(mockMessages);

  const [sourceFilter, setSourceFilter] = useState<CallSource | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [selectedCall, setSelectedCall] = useState<CallListItem | null>(null);
  const [callDetailOpen, setCallDetailOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const [uploadCustomerId, setUploadCustomerId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFilename, setUploadFilename] = useState("");
  const [uploadStartAt, setUploadStartAt] = useState("");

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const customerMap = useMemo(
    () => new Map(mockCustomersListItems.map((c) => [c.id, c])),
    []
  );

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      if (sourceFilter !== "all" && call.source !== sourceFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "failed") {
          return (
            call.processing_status === "failed" ||
            call.processing_status === "error"
          );
        }
        return call.processing_status === statusFilter;
      }
      return true;
    });
  }, [calls, sourceFilter, statusFilter]);

  const chatGroups = useMemo(() => {
    const map = new Map<string, Message[]>();
    messages.forEach((msg) => {
      if (!msg.chat_id) return;
      const list = map.get(msg.chat_id) ?? [];
      list.push(msg);
      map.set(msg.chat_id, list);
    });

    const groups = Array.from(map.entries()).map(([chatId, msgs]) => {
      const sorted = [...msgs].sort(
        (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );
      const last = sorted[sorted.length - 1];
      const customer = last.customer_id ? customerMap.get(last.customer_id) : null;

      return {
        chatId,
        messages: sorted,
        source: last.source,
        lastMessageAt: last.sent_at,
        preview: last.content,
        customerName: customer?.name ?? "Без клиента",
        messageCount: sorted.length,
      };
    });

    groups.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return groups;
  }, [messages, customerMap]);

  const sourceOptions: Array<{ value: CallSource | "all"; label: string }> = [
    { value: "all", label: "Все" },
    { value: CallSource.MANUAL, label: "Ручной" },
    { value: CallSource.JITSI, label: "Jitsi" },
    { value: CallSource.BITRIX, label: "Bitrix" },
  ];

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "Все" },
    { value: "completed", label: "Завершён" },
    { value: "pending", label: "Ожидает" },
    { value: "failed", label: "Ошибка" },
  ];

  const openCallDetail = (call: CallListItem) => {
    setSelectedCall(call);
    setCallDetailOpen(true);
  };

  const handleUpload = () => {
    if (!uploadCustomerId || !uploadTitle.trim()) {
      addToast({
        title: "Ошибка",
        description: "Выберите клиента и укажите название звонка",
        variant: "error",
      });
      return;
    }

    const customer = customerMap.get(uploadCustomerId);
    const startAt = uploadStartAt
      ? new Date(uploadStartAt).toISOString()
      : new Date().toISOString();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `call-${Date.now()}`;

    const newCall: CallListItem = {
      id,
      customer_id: uploadCustomerId,
      customer_name: customer?.name ?? null,
      source: CallSource.MANUAL,
      title: uploadTitle.trim(),
      started_at: startAt,
      duration: null,
      processing_status: "pending",
      has_summary: false,
      created_at: new Date().toISOString(),
    };

    setCalls((prev) => [newCall, ...prev]);
    setUploadDialogOpen(false);
    setUploadCustomerId("");
    setUploadTitle("");
    setUploadFilename("");
    setUploadStartAt("");

    addToast({
      title: "Запись добавлена",
      description: "Звонок поставлен в очередь на обработку",
      variant: "success",
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Коммуникации</h1>
          <p className="text-muted-foreground">
            Созвоны и переписки в одном месте
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Mic className="h-4 w-4" />
          Загрузить запись
        </Button>
      </div>

      <Tabs defaultValue="calls">
        <TabsList variant="underline">
          <TabsTrigger value="calls" variant="underline">
            Звонки
          </TabsTrigger>
          <TabsTrigger value="messages" variant="underline">
            Переписки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Фильтры
            </div>
            <div className="flex flex-wrap gap-2">
              {sourceOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={sourceFilter === option.value ? "default" : "outline"}
                  onClick={() => setSourceFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={statusFilter === option.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredCalls.map((call) => (
              <button
                key={call.id}
                type="button"
                onClick={() => openCallDetail(call)}
                className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {call.title || "Без названия"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {call.customer_name ?? "Не привязан"} · {" "}
                      {formatDateTime(call.started_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" size="sm">
                      {formatDuration(call.duration)}
                    </Badge>
                    <SourceBadge source={call.source} size="sm" />
                    <StatusBadge
                      status={getStatusType(call.processing_status)}
                      size="sm"
                    >
                      {getStatusLabel(call.processing_status)}
                    </StatusBadge>
                  </div>
                </div>
              </button>
            ))}
            {filteredCalls.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                Ничего не найдено
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="space-y-3">
            {chatGroups.map((chat) => (
              <div
                key={chat.chatId}
                className={cn(
                  "rounded-2xl border border-border bg-card p-4 transition-all",
                  selectedChatId === chat.chatId && "border-primary/40 shadow-sm"
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedChatId(
                      selectedChatId === chat.chatId ? null : chat.chatId
                    )
                  }
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-foreground truncate">
                          {chat.customerName}
                        </p>
                        <SourceBadge source={chat.source} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {chat.preview}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="secondary" size="sm">
                        {chat.messageCount} сообщений
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(chat.lastMessageAt), {
                          locale: ru,
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </button>

                {selectedChatId === chat.chatId && (
                  <div className="mt-4 space-y-3">
                    {chat.messages.map((msg) => {
                      const isIncoming =
                        msg.direction === MessageDirection.INCOMING;

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isIncoming ? "justify-start" : "justify-end"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-xl px-4 py-2.5",
                              isIncoming
                                ? "bg-muted text-foreground rounded-bl-sm"
                                : "bg-primary text-primary-foreground rounded-br-sm"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  isIncoming
                                    ? "text-muted-foreground"
                                    : "text-primary-foreground/80"
                                )}
                              >
                                {msg.sender_name || "Участник"}
                              </span>
                              <SourceBadge source={msg.source} size="sm" />
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <div
                              className={cn(
                                "text-xs mt-1 text-right",
                                isIncoming
                                  ? "text-muted-foreground"
                                  : "text-primary-foreground/70"
                              )}
                            >
                              {format(new Date(msg.sent_at), "HH:mm", {
                                locale: ru,
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {chatGroups.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                Чаты не найдены
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить запись</DialogTitle>
            <DialogDescription>
              Загрузите аудиофайл звонка для последующей расшифровки
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Клиент
              </label>
              <select
                value={uploadCustomerId}
                onChange={(e) => setUploadCustomerId(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Выберите клиента...</option>
                {mockCustomersListItems.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.company ? ` (${customer.company})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Название звонка"
              placeholder="Например: Еженедельный синк"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Дата и время звонка
              </label>
              <input
                type="datetime-local"
                value={uploadStartAt}
                onChange={(e) => setUploadStartAt(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Аудиофайл
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-3 cursor-pointer hover:bg-secondary/60 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">
                  {uploadFilename || "Выберите файл (mp3, wav)"}
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
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpload}>
              <Phone className="h-4 w-4" />
              Загрузить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={callDetailOpen} onOpenChange={setCallDetailOpen}>
        <DialogContent>
          {selectedCall && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCall.title || "Без названия"}</DialogTitle>
                <DialogDescription>
                  {selectedCall.customer_name ?? "Клиент не привязан"} · {" "}
                  {formatDateTime(selectedCall.started_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDuration(selectedCall.duration)}
                  </div>
                  <div className="flex items-center gap-2">
                    <SourceBadge source={selectedCall.source} size="sm" />
                    <StatusBadge
                      status={getStatusType(selectedCall.processing_status)}
                      size="sm"
                    >
                      {getStatusLabel(selectedCall.processing_status)}
                    </StatusBadge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Саммари</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedCall.processing_status === "completed"
                      ? "Обсудили текущие отгрузки, согласовали план на следующую неделю и определили ответственных."
                      : "Саммари будет доступно после обработки аудиозаписи."}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Транскрипт
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedCall.processing_status === "completed"
                      ? "Клиент отметил рост продаж, уточнил сроки поставки и попросил подготовить отчёт по SLA."
                      : "Транскрипт будет доступен после обработки аудиофайла."}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Ключевые пункты
                  </h4>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Обсудили сроки поставки</li>
                    <li>Согласовали модель ценообразования</li>
                    <li>Запланировали следующий звонок</li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCallDetailOpen(false)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
