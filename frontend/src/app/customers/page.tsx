"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, Phone, Mail, MessageSquare, Search, AlertTriangle } from "lucide-react";

import { type CustomerListItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useDataStore } from "@/lib/data-store";

// ==========================================
// Avatar matte color palette (no purple)
// ==========================================

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-stone-100 text-stone-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ==========================================
// Customer Card
// ==========================================

function CustomerCard({ customer }: { customer: CustomerListItem }) {
  const router = useRouter();
  const avatarColor = getAvatarColor(customer.name);
  const firstLetter = customer.name.charAt(0).toUpperCase();

  const lastInteractionText = customer.last_interaction
    ? formatDistanceToNow(new Date(customer.last_interaction), {
        addSuffix: true,
        locale: ru,
      })
    : "нет данных";

  return (
    <div
      onClick={() => router.push(`/customers/${customer.id}`)}
      className="group cursor-pointer rounded-lg border border-border bg-card p-4 hover:bg-secondary/50 transition-colors"
    >
      {/* Header: Avatar + Name/Company */}
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold ${avatarColor}`}
        >
          {firstLetter}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {customer.name}
          </h3>
          {customer.company && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {customer.company}
            </p>
          )}
        </div>

        {/* Alert badge */}
        {customer.unread_alerts_count > 0 && (
          <Badge variant="destructive" size="sm" className="shrink-0">
            <AlertTriangle className="h-3 w-3" />
            {customer.unread_alerts_count}
          </Badge>
        )}
      </div>

      {/* Contact info row */}
      <div className="mt-3 flex items-center gap-3 text-muted-foreground">
        {customer.phone && (
          <div className="flex items-center gap-1" title={customer.phone}>
            <Phone className="h-3.5 w-3.5" />
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-1" title={customer.email}>
            <Mail className="h-3.5 w-3.5" />
          </div>
        )}
        {customer.telegram_username && (
          <div
            className="flex items-center gap-1"
            title={`@${customer.telegram_username}`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{customer.calls_count}</span>{" "}
          звонков ·{" "}
          <span className="font-medium text-foreground">{customer.messages_count}</span>{" "}
          сообщений
        </p>
      </div>

      {/* Last interaction */}
      <div className="mt-2 border-t border-border pt-2">
        <p className="text-xs text-muted-foreground">
          Последнее:{" "}
          <span className="text-foreground">{lastInteractionText}</span>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// Add Customer Dialog
// ==========================================

interface AddCustomerFormData {
  name: string;
  company: string;
  phone: string;
  email: string;
  telegram_username: string;
}

const EMPTY_FORM: AddCustomerFormData = {
  name: "",
  company: "",
  phone: "",
  email: "",
  telegram_username: "",
};

function AddCustomerDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AddCustomerFormData) => void;
}) {
  const [form, setForm] = useState<AddCustomerFormData>(EMPTY_FORM);
  const [nameError, setNameError] = useState("");

  const updateField = (field: keyof AddCustomerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name" && value.trim()) setNameError("");
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setNameError("Имя клиента обязательно");
      return;
    }
    onSave(form);
    setForm(EMPTY_FORM);
    setNameError("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setForm(EMPTY_FORM);
    setNameError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый клиент</DialogTitle>
          <DialogDescription>
            Заполните информацию о клиенте. Поле «Имя» обязательно.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <Input
            label="Имя *"
            placeholder="Иван Петров"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={nameError}
          />
          <Input
            label="Компания"
            placeholder="ООО «Компания»"
            value={form.company}
            onChange={(e) => updateField("company", e.target.value)}
          />
          <Input
            label="Телефон"
            placeholder="+7 (900) 123-45-67"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
          <Input
            label="Email"
            placeholder="client@example.ru"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
          <Input
            label="Telegram"
            placeholder="username"
            value={form.telegram_username}
            onChange={(e) => updateField("telegram_username", e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Customers Page
// ==========================================

export default function CustomersPage() {
  const { addToast } = useToast();
  const { customers, addCustomer } = useDataStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMyOnly, setShowMyOnly] = useState(true); // Default: show only my clients

  // Filter by name or company (case-insensitive)
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.name.toLowerCase().includes(q);
    const companyMatch = c.company?.toLowerCase().includes(q) ?? false;
    return nameMatch || companyMatch;
  });

  const handleAddCustomer = (data: AddCustomerFormData) => {
    const newCustomer: CustomerListItem = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      company: data.company.trim() || null,
      phone: data.phone.trim() || null,
      email: data.email.trim() || null,
      telegram_username: data.telegram_username.trim() || null,
      calls_count: 0,
      messages_count: 0,
      unread_alerts_count: 0,
      last_interaction: null,
      created_at: new Date().toISOString(),
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setShowAddDialog(false);

    addToast({
      title: "Клиент добавлен",
      description: `${newCustomer.name} успешно добавлен в список клиентов.`,
      variant: "success",
    });
  };

  return (
    <div className="px-6 py-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            Клиенты
          </h1>
          <p className="text-sm text-muted-foreground">
            {customers.length} клиентов в базе
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить клиента
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setShowMyOnly(!showMyOnly)}
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
            showMyOnly
              ? "bg-tertiary text-foreground font-medium"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          {showMyOnly ? "Мои клиенты" : "Все клиенты"}
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Поиск по имени или компании..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Customer grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-semibold">
            Клиенты не найдены
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Попробуйте изменить параметры поиска или добавьте нового клиента.
          </p>
        </div>
      )}

      {/* Add customer dialog */}
      <AddCustomerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleAddCustomer}
      />
    </div>
  );
}
