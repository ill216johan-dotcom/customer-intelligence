"use client";

import React, { use, useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Send,
  Phone,
  Mail,
  MessageSquare,
  Search,
  Plus,
  FileText,
  Sparkles,
  ArrowLeft,
  Edit,
  Trash2,
} from "lucide-react";

import {
  type Customer,
  type CallListItem,
  type Message,
  type Note,
  type Alert,
  MessageDirection,
  AlertSeverity,
} from "@/lib/types";
import {
  getCustomerById,
} from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge, SourceBadge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

// ==========================================
// Avatar Colors
// ==========================================

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-stone-100 text-stone-700",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ==========================================
// Helpers
// ==========================================

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const minutes = Math.round(seconds / 60);
  return `${minutes}мин`;
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: ru });
}

function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy", { locale: ru });
}

function formatTime(dateStr: string): string {
  return format(new Date(dateStr), "HH:mm", { locale: ru });
}

// ==========================================
// Types
// ==========================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ==========================================
// Components
// ==========================================

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <span className="text-sm font-medium text-muted-foreground sm:w-36 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{children || "—"}</span>
    </div>
  );
}

// ==========================================
// Chat Tab (Customer-specific RAG)
// ==========================================

function CustomerChatTab({ customerName }: { customerName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Здравствуйте! Я AI-ассистент по клиенту "${customerName}". Могу помочь найти информацию о звонках, сообщениях и заметках. Что вас интересует?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const aiResponse: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `По клиенту "${customerName}" нашлась следующая информация:\n\n• Последний звонок: 3 дня назад, длительностью 15 минут\n• Есть 2 непрочитанных сообщения\n• Активный алерт о просроченном платеже\n\nХотите подробнее изучить какой-то из этих пунктов?`,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, aiResponse]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-secondary text-foreground"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">AI</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>
              <p className={`text-xs mt-1 ${msg.role === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">AI печатает...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Спросите об этом клиенте..."
          className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring/50"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="sm"
          className="gap-2"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// Knowledge Base Tab (Customer-specific)
// ==========================================

function CustomerKnowledgeTab({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = () => {
    if (!query.trim()) return;

    // Mock search results
    setResults([
      `Из звонка от 10.02.2025: "${customerName}" интересуется новыми тарифами`,
      `Заметка от 08.02.2025: Клиент просил перезвонить после 15:00`,
      `Сообщение в Telegram от 12.02.2025: Вопрос по счёту #1234`,
    ]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Поиск по базе клиента</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Найти в звонках, сообщениях, заметках..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring/50"
            />
          </div>
          <Button onClick={handleSearch} disabled={!query.trim()} size="sm">
            Найти
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Найдено: {results.length}
          </h4>
          <div className="space-y-2">
            {results.map((result, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-secondary/30">
                <p className="text-sm">{result}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Введите запрос для поиска</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Статистика
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-border bg-secondary/30 text-center">
            <p className="text-lg font-semibold">12</p>
            <p className="text-xs text-muted-foreground">Звонков</p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-secondary/30 text-center">
            <p className="text-lg font-semibold">45</p>
            <p className="text-xs text-muted-foreground">Сообщений</p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-secondary/30 text-center">
            <p className="text-lg font-semibold">3</p>
            <p className="text-xs text-muted-foreground">Заметок</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Page Component
// ==========================================

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  // Use store for data
  const {
    getCustomer,
    getCallsForCustomer,
    getMessagesForCustomer,
    getNotesForCustomer,
    getAlertsForCustomer,
    addNote,
    deleteNote,
    markAlertRead,
    resolveAlert,
    updateCustomer,
    deleteCustomer,
  } = useDataStore();

  // ---- State ----
  const initialCustomer = getCustomer(id);
  const [customer, setCustomer] = useState<Customer | undefined>(initialCustomer);

  const calls = getCallsForCustomer(id);
  const messages = getMessagesForCustomer(id);
  const [notes, setNotes] = useState<Note[]>(getNotesForCustomer(id));
  const [alerts, setAlerts] = useState<Alert[]>(getAlertsForCustomer(id));

  // Dialogs
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [callDetailOpen, setCallDetailOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);

  const [selectedCall, setSelectedCall] = useState<CallListItem | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");

  // Edit form
  const [editForm, setEditForm] = useState({
    name: customer?.name ?? "",
    company: customer?.company ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    telegram_username: customer?.telegram_username ?? "",
    products: customer?.products ?? "",
    pains: customer?.pains ?? "",
    conflicts: customer?.conflicts ?? "",
  });

  // ---- Not Found ----
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-xl font-semibold">Клиент не найден</h1>
        <p className="text-sm text-muted-foreground">Клиент с данным ID не существует.</p>
        <Button variant="outline" onClick={() => router.push("/customers")}>
          ← Вернуться к списку
        </Button>
      </div>
    );
  }

  // ---- Handlers ----

  function handleCallClick(call: CallListItem) {
    setSelectedCall(call);
    setCallDetailOpen(true);
  }

  function handleAddNote() {
    if (!newNoteContent.trim()) return;
    const newNote: Note = {
      id: crypto.randomUUID(),
      customer_id: id,
      author_id: null,
      author_name: "Текущий пользователь",
      content: newNoteContent.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addNote(newNote);
    setNotes(getNotesForCustomer(id));
    setNewNoteContent("");
    setAddNoteOpen(false);
    addToast({ title: "Заметка добавлена", variant: "success" });
  }

  function handleDeleteNote(noteId: string) {
    deleteNote(noteId);
    setNotes(getNotesForCustomer(id));
    addToast({ title: "Заметка удалена", variant: "default" });
  }

  function handleMarkAlertRead(alertId: string) {
    markAlertRead(alertId);
    setAlerts(getAlertsForCustomer(id));
    addToast({ title: "Алерт отмечен как прочитанный", variant: "success" });
  }

  function handleResolveAlert(alertId: string) {
    resolveAlert(alertId);
    setAlerts(getAlertsForCustomer(id));
    addToast({ title: "Алерт решён", variant: "success" });
  }
    addToast({ title: "Алерт решён", variant: "success" });
  }

  function handleSaveEdit() {
    updateCustomer(id, {
      name: editForm.name,
      company: editForm.company || null,
      phone: editForm.phone || null,
      email: editForm.email || null,
      telegram_username: editForm.telegram_username || null,
      products: editForm.products || null,
      pains: editForm.pains || null,
      conflicts: editForm.conflicts || null,
    });
    setCustomer(getCustomer(id));
    setEditOpen(false);
    addToast({ title: "Клиент обновлён", variant: "success" });
  }

  function handleDelete() {
    deleteCustomer(id);
    setDeleteOpen(false);
    addToast({ title: "Клиент удалён", variant: "default" });
    router.push("/customers");
  }

  function openEditDialog() {
    setEditForm({
      name: customer?.name ?? "",
      company: customer?.company ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      telegram_username: customer?.telegram_username ?? "",
      products: customer?.products ?? "",
      pains: customer?.pains ?? "",
      conflicts: customer?.conflicts ?? "",
    });
    setEditOpen(true);
  }

  const avatarColor = getAvatarColor(customer.name);

  // ---- Render ----
  return (
    <div className="px-6 py-5 max-w-5xl mx-auto">
      {/* ====== Header ====== */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/customers")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Клиенты
        </Button>
      </div>

      {/* ====== Customer Card ====== */}
      <div className="p-5 rounded-xl border border-border bg-card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold ${avatarColor}`}>
              {customer.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{customer.name}</h1>
              {customer.company && (
                <p className="text-sm text-muted-foreground">{customer.company}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Edit className="w-4 h-4 mr-1" />
              Редактировать
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label="Телефон">
            {customer.phone}
          </InfoRow>
          <InfoRow label="Email">{customer.email}</InfoRow>
          <InfoRow label="Telegram">
            {customer.telegram_username ? `@${customer.telegram_username}` : "—"}
          </InfoRow>
          <InfoRow label="Работаем с">
            {customer.working_since ? formatShortDate(customer.working_since) : "—"}
          </InfoRow>
        </div>

        {/* AI Summary */}
        {customer.ai_summary && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">AI-резюме</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {customer.ai_summary}
            </p>
          </div>
        )}
      </div>

      {/* ====== Tabs ====== */}
      <Tabs defaultValue="chat">
        <TabsList variant="underline" className="w-full justify-start">
          <TabsTrigger value="chat" variant="underline">
            Чат клиента
          </TabsTrigger>
          <TabsTrigger value="knowledge" variant="underline">
            База
          </TabsTrigger>
          <TabsTrigger value="calls" variant="underline">
            Звонки
            {calls.length > 0 && (
              <Badge variant="secondary" size="sm" className="ml-2">
                {calls.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" variant="underline">
            Переписки
            {messages.length > 0 && (
              <Badge variant="secondary" size="sm" className="ml-2">
                {messages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes" variant="underline">
            Заметки
            {notes.length > 0 && (
              <Badge variant="secondary" size="sm" className="ml-2">
                {notes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <CustomerChatTab customerName={customer.name} />
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="mt-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <CustomerKnowledgeTab customerId={id} customerName={customer.name} />
          </div>
        </TabsContent>

        <TabsContent value="calls" className="mt-4">
          <div className="space-y-2">
            {calls.map((call) => (
              <button
                key={call.id}
                type="button"
                onClick={() => handleCallClick(call)}
                className="w-full text-left rounded-lg border border-border bg-card p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {call.title || "Без названия"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(call.started_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{formatDuration(call.duration)}</span>
                    <SourceBadge source={call.source} />
                    <StatusBadge
                      status={
                        call.processing_status === "completed"
                          ? "completed"
                          : "pending"
                      }
                    >
                      {call.processing_status === "completed" ? "Готов" : "В обработке"}
                    </StatusBadge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <div className="space-y-3">
            {messages.map((msg) => {
              const isIncoming = msg.direction === MessageDirection.INCOMING;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                      isIncoming
                        ? "bg-secondary text-foreground"
                        : "bg-foreground text-background"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {msg.sender_name || "Неизвестный"}
                      </span>
                      <SourceBadge source={msg.source} size="sm" />
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-60 text-right">
                      {formatTime(msg.sent_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              onClick={() => {
                setNewNoteContent("");
                setAddNoteOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить заметку
            </Button>
          </div>
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="text-sm whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-muted-foreground">
                    {note.author_name || "Автор неизвестен"} · {formatShortDate(note.created_at)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ====== Call Detail Dialog ====== */}
      <Dialog open={callDetailOpen} onOpenChange={setCallDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCall?.title || "Звонок"}</DialogTitle>
            <DialogDescription>
              {selectedCall && formatDate(selectedCall.started_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedCall && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Источник:</span>
                <SourceBadge source={selectedCall.source} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Длительность:</span>
                <span>{formatDuration(selectedCall.duration)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Закрыть</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Add Note Dialog ====== */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новая заметка</DialogTitle>
            <DialogDescription>
              Добавьте заметку по клиенту {customer.name}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Введите текст заметки..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Отмена</Button>
            </DialogClose>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNoteContent.trim()}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Edit Dialog ====== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать клиента</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              label="Имя"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <Input
              label="Компания"
              value={editForm.company}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, company: e.target.value }))
              }
            />
            <Input
              label="Телефон"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, email: e.target.value }))
              }
            />
            <Input
              label="Telegram"
              value={editForm.telegram_username}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  telegram_username: e.target.value,
                }))
              }
            />
            <Input
              label="Товары"
              value={editForm.products}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, products: e.target.value }))
              }
            />
            <Textarea
              label="Проблемы / боли"
              value={editForm.pains}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, pains: e.target.value }))
              }
            />
            <Textarea
              label="Конфликты"
              value={editForm.conflicts}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, conflicts: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Отмена</Button>
            </DialogClose>
            <Button size="sm" onClick={handleSaveEdit} disabled={!editForm.name.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Delete Confirmation Dialog ====== */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить клиента?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить клиента «{customer.name}»? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Отмена</Button>
            </DialogClose>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
