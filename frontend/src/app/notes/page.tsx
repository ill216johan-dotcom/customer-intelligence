"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, Search, Bell, Calendar, User, Trash2, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useDataStore, type PersonalNote } from "@/lib/data-store";

export default function NotesPage() {
  const { addToast } = useToast();
  const { personalNotes, addPersonalNote, deletePersonalNote, customers } = useDataStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterPrivate, setFilterPrivate] = useState<"all" | "private" | "shared">("all");

  // Form state
  const [noteContent, setNoteContent] = useState("");
  const [noteCustomerId, setNoteCustomerId] = useState("");
  const [noteIsPrivate, setNoteIsPrivate] = useState(false);
  const [noteAlertAt, setNoteAlertAt] = useState("");

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return personalNotes.filter((note) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!note.content.toLowerCase().includes(q) &&
            !(note.customer_name?.toLowerCase().includes(q))) {
          return false;
        }
      }

      // Privacy filter
      if (filterPrivate === "private" && !note.is_private) return false;
      if (filterPrivate === "shared" && note.is_private) return false;

      return true;
    });
  }, [personalNotes, searchQuery, filterPrivate]);

  // Sort: notes with alerts first, then by date
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.alert_at && !b.alert_at) return -1;
      if (!a.alert_at && b.alert_at) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredNotes]);

  // Handlers
  const handleAddNote = () => {
    if (!noteContent.trim()) {
      addToast({ title: "Ошибка", description: "Введите текст заметки", variant: "error" });
      return;
    }

    const customer = customers.find((c) => c.id === noteCustomerId);

    const newNote: PersonalNote = {
      id: crypto.randomUUID(),
      content: noteContent.trim(),
      customer_id: noteCustomerId || null,
      customer_name: customer?.name || null,
      is_private: noteIsPrivate,
      alert_at: noteAlertAt || null,
      created_at: new Date().toISOString(),
      created_by: "Администратор",
    };

    addPersonalNote(newNote);
    setShowAddDialog(false);
    setNoteContent("");
    setNoteCustomerId("");
    setNoteIsPrivate(false);
    setNoteAlertAt("");

    addToast({ title: "Заметка создана", variant: "success" });
  };

  const handleDeleteNote = (id: string) => {
    deletePersonalNote(id);
    addToast({ title: "Заметка удалена", variant: "default" });
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: ru });
  };

  const isAlertDue = (alertAt: string | null) => {
    if (!alertAt) return false;
    return new Date(alertAt) <= new Date();
  };

  return (
    <div className="px-6 py-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Заметки</h1>
          <p className="text-sm text-muted-foreground">
            Личные заметки и напоминания по клиентам
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Новая заметка
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1">
          {[
            { key: "all", label: "Все" },
            { key: "shared", label: "Общие" },
            { key: "private", label: "Личные" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterPrivate(f.key as typeof filterPrivate)}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                filterPrivate === f.key
                  ? "bg-tertiary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по заметкам..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring/50 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Notes List */}
      {sortedNotes.length > 0 ? (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-lg border ${
                note.alert_at && isAlertDue(note.alert_at)
                  ? "border-amber-200 bg-amber-50/50"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {note.is_private ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" title="Личная заметка" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" title="Общая заметка" />
                  )}
                  {note.alert_at && (
                    <Badge
                      variant={isAlertDue(note.alert_at) ? "destructive" : "secondary"}
                      size="sm"
                      className="gap-1"
                    >
                      <Bell className="w-3 h-3" />
                      {isAlertDue(note.alert_at) ? "Срочно" : formatDate(note.alert_at)}
                    </Badge>
                  )}
                  {note.customer_name && (
                    <Badge variant="outline" size="sm">
                      <User className="w-3 h-3 mr-1" />
                      {note.customer_name}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>

              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {note.created_by}
                </span>
                <span>·</span>
                <span>{formatDate(note.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-semibold">Нет заметок</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Создайте первую заметку для отслеживания важных задач
          </p>
        </div>
      )}

      {/* Add Note Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новая заметка</DialogTitle>
            <DialogDescription>
              Создайте личную заметку или прикрепите к клиенту
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Текст заметки..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
            />

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Клиент (опционально)
              </label>
              <select
                value={noteCustomerId}
                onChange={(e) => setNoteCustomerId(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring/50"
              >
                <option value="">Без клиента</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Напоминание (опционально)
              </label>
              <input
                type="datetime-local"
                value={noteAlertAt}
                onChange={(e) => setNoteAlertAt(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring/50"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noteIsPrivate}
                onChange={(e) => setNoteIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">
                Личная заметка <span className="text-muted-foreground">(только для меня)</span>
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddNote}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
