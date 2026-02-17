"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Search, Mic, Plus, Sparkles, MessageSquare, Phone, Database } from "lucide-react";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE = RAW_API_BASE.endsWith("/api") ? RAW_API_BASE : `${RAW_API_BASE}/api`;

type Customer = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
};

type CallListItem = {
  id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  source: string;
  title?: string | null;
  started_at: string;
  duration?: number | null;
  processing_status: string;
  has_summary?: boolean;
};

type CallDetail = {
  id: string;
  customer_id?: string | null;
  source: string;
  title?: string | null;
  started_at: string;
  duration?: number | null;
  transcript?: string | null;
  summary?: string | null;
  key_points?: string[] | null;
  action_items?: string[] | null;
  processing_status: string;
  processing_error?: string | null;
};

type TranscriptionStatus = {
  call_id: string;
  status: string;
  progress?: number | null;
  error?: string | null;
};

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({
    username: "admin@example.com",
    password: "admin123",
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const [customerForm, setCustomerForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
  });
  const [customerCreateLoading, setCustomerCreateLoading] = useState(false);
  const [customerCreateError, setCustomerCreateError] = useState<string | null>(null);
  const [customerCreateSuccess, setCustomerCreateSuccess] = useState<string | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadStartedAt, setUploadStartedAt] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastCallId, setLastCallId] = useState<string | null>(null);

  const [calls, setCalls] = useState<CallListItem[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsError, setCallsError] = useState<string | null>(null);

  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [callDetail, setCallDetail] = useState<CallDetail | null>(null);
  const [callDetailLoading, setCallDetailLoading] = useState(false);
  const [callDetailError, setCallDetailError] = useState<string | null>(null);

  const [status, setStatus] = useState<TranscriptionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

      const apiFetch = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers ?? {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    console.log(`[API] ${options.method || 'GET'} ${path}`, options);

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    console.log(`[API] ${options.method || 'GET'} ${path} → ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = `Ошибка ${response.status}`;
      try {
        const data = await response.json();
        console.error(`[API] Error response:`, data);
        if (data?.detail) errorMessage = data.detail;
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("ci_token");
    if (stored) {
      setToken(stored);
    }
    
    // Cleanup status check interval on unmount
    return () => {
      const interval = (window as any).statusCheckInterval;
      if (interval) {
        clearInterval(interval);
        console.log("[CLEANUP] Очистка интервала проверки статуса");
      }
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadCustomers();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadCalls();
  }, [token, selectedCustomerId]);

  // Timer for elapsed time during processing
  useEffect(() => {
    if (status?.status === "processing" && processingStartTime) {
      const timer = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - processingStartTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status?.status, processingStartTime]);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const formData = new URLSearchParams();
      formData.append("username", loginForm.username);
      formData.append("password", loginForm.password);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.detail ?? "Ошибка авторизации";
        throw new Error(message);
      }

      const data = (await response.json()) as { access_token: string };
      setToken(data.access_token);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ci_token", data.access_token);
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Ошибка авторизации");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCustomers([]);
    setCalls([]);
    setSelectedCustomerId("");
    setSelectedCallId(null);
    setCallDetail(null);
    setStatus(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ci_token");
    }
  };

  const loadCustomers = async () => {
    if (!token) return;
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const data = await apiFetch<Customer[]>("/customers");
      setCustomers(data);
      if (!selectedCustomerId && data.length > 0) {
        setSelectedCustomerId(data[0].id);
      }
    } catch (error) {
      setCustomersError(error instanceof Error ? error.message : "Ошибка загрузки клиентов");
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleCreateCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setCustomerCreateLoading(true);
    setCustomerCreateError(null);
    setCustomerCreateSuccess(null);
    try {
      const created = await apiFetch<Customer>("/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customerForm.name,
          company: customerForm.company || undefined,
          email: customerForm.email || undefined,
          phone: customerForm.phone || undefined,
        }),
      });
      setCustomerCreateSuccess(`Клиент создан: ${created.name}`);
      setCustomerForm({ name: "", company: "", email: "", phone: "" });
      await loadCustomers();
      setSelectedCustomerId(created.id);
    } catch (error) {
      setCustomerCreateError(error instanceof Error ? error.message : "Ошибка создания клиента");
    } finally {
      setCustomerCreateLoading(false);
    }
  };

  const handleUploadCall = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setUploadError(null);
    setStatus(null);
    setCallDetail(null);
    if (!uploadFile) {
      setUploadError("Выберите аудиофайл");
      return;
    }
    
    // Логирование
    console.log(`[UPLOAD] Начинаем загрузку файла:`, uploadFile.name, `Размер: ${uploadFile.size} байт`);
    
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (selectedCustomerId) formData.append("customer_id", selectedCustomerId);
      if (uploadTitle.trim()) formData.append("title", uploadTitle.trim());
      if (uploadStartedAt) {
        const iso = new Date(uploadStartedAt).toISOString();
        formData.append("started_at", iso);
      }

      console.log(`[UPLOAD] Отправка на сервер...`);

      const created = await apiFetch<CallDetail>("/calls/upload", {
        method: "POST",
        body: formData,
      });
      
      console.log(`[UPLOAD] Успешная загрузка! Call ID:`, created.id);
      
      setLastCallId(created.id);
      setSelectedCallId(created.id);
      setUploadTitle("");
      setUploadStartedAt("");
      setUploadFile(null);
      setProcessingStartTime(Date.now());
      setElapsedSeconds(0);
      await loadCalls();
      await loadCallDetail(created.id);
      
      // Автоматически начинаем проверять статус
      console.log(`[UPLOAD] Запуска мониторинга статуса...`);
      
      // Clear old interval if any
      const oldInterval = (window as any).statusCheckInterval;
      if (oldInterval) clearInterval(oldInterval);
      
      const checkInterval = setInterval(async () => {
        try {
          const statusData = await apiFetch<TranscriptionStatus>(`/calls/${created.id}/status`);
          console.log(`[STATUS] Текущий статус:`, statusData.status, statusData);
          setStatus(statusData);
          
          if (statusData.status === "completed" || statusData.status === "failed") {
            clearInterval(checkInterval);
            await loadCallDetail(created.id);
            await loadCalls();
            console.log(`[STATUS] Обработка завершена!`);
          }
        } catch (e) {
          console.error("[STATUS] Ошибка при проверке статуса:", e);
          clearInterval(checkInterval);
        }
      }, 5000); // Каждые 5 секунд (не перегружаем API)
      
      // Сохраняем ID интервала для очистки
      (window as any).statusCheckInterval = checkInterval;
      
    } catch (error) {
      console.error("[UPLOAD] Ошибка загрузки:", error);
      setUploadError(error instanceof Error ? error.message : "Ошибка загрузки звонка");
    } finally {
      setUploadLoading(false);
    }
  };

  const loadCalls = async () => {
    if (!token) return;
    setCallsLoading(true);
    setCallsError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCustomerId) params.set("customer_id", selectedCustomerId);
      const query = params.toString();
      const data = await apiFetch<CallListItem[]>(`/calls${query ? `?${query}` : ""}`);
      setCalls(data);
    } catch (error) {
      setCallsError(error instanceof Error ? error.message : "Ошибка загрузки созвонов");
    } finally {
      setCallsLoading(false);
    }
  };

  const loadCallDetail = async (callId: string) => {
    if (!token) return;
    setCallDetailLoading(true);
    setCallDetailError(null);
    try {
      const data = await apiFetch<CallDetail>(`/calls/${callId}`);
      setCallDetail(data);
    } catch (error) {
      setCallDetailError(error instanceof Error ? error.message : "Ошибка загрузки деталей звонка");
    } finally {
      setCallDetailLoading(false);
    }
  };

  const loadStatus = async (callId: string) => {
    if (!token) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await apiFetch<TranscriptionStatus>(`/calls/${callId}/status`);
      setStatus(data);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Ошибка статуса обработки");
    } finally {
      setStatusLoading(false);
    }
  };

  const scrollToTestPanel = () => {
    if (typeof window === "undefined") return;
    document.getElementById("test-panel")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCallSelect = (callId: string) => {
    setSelectedCallId(callId);
    void loadCallDetail(callId);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Доброе утро, Админ
          </h1>
          <p className="text-muted-foreground text-lg">
            Вот что произошло с вашими клиентами сегодня.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-95 font-medium">
            <Plus className="w-5 h-5" />
            <span>Заметка</span>
          </button>
          <button
            type="button"
            onClick={scrollToTestPanel}
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-all active:scale-95 font-medium border border-border"
          >
            <Mic className="w-5 h-5" />
            <span>Загрузить звонок</span>
          </button>
        </div>
      </div>

      <div className="relative group max-w-3xl mx-auto w-full">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Спросите что угодно о клиентах (например: 'Итоги последнего созвона с Иваном')..."
          className="w-full pl-14 pr-4 py-4 rounded-2xl border border-border bg-background shadow-sm hover:shadow-md focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg"
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Поиск</span>
          </div>
        </div>
      </div>

      <section id="test-panel" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Панель тестирования (без Jitsi)</h2>
          <span className="text-xs text-muted-foreground">API: {API_BASE}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Доступ</h3>
                {token ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Выйти
                  </button>
                ) : null}
              </div>
              {token ? (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  ✓ Авторизация успешна
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="email"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Email"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                  />
                  <input
                    type="password"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Пароль"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  />
                  {loginError && <div className="text-xs text-red-600">{loginError}</div>}
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loginLoading}
                    className="w-full rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {loginLoading ? "Вход..." : "Войти"}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Новый клиент</h3>
                <button
                  type="button"
                  onClick={loadCustomers}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Обновить
                </button>
              </div>
              <form className="space-y-3" onSubmit={handleCreateCustomer}>
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Имя клиента"
                  value={customerForm.name}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Компания"
                  value={customerForm.company}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, company: event.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Email"
                  value={customerForm.email}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Телефон"
                  value={customerForm.phone}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
                {customerCreateError ? (
                  <div className="text-xs text-red-600">{customerCreateError}</div>
                ) : null}
                {customerCreateSuccess ? (
                  <div className="text-xs text-emerald-700">{customerCreateSuccess}</div>
                ) : null}
                <button
                  type="submit"
                  disabled={!token || customerCreateLoading}
                  className="w-full rounded-xl bg-secondary text-secondary-foreground py-2 text-sm font-medium border border-border disabled:opacity-60"
                >
                  {customerCreateLoading ? "Создание..." : "Создать клиента"}
                </button>
              </form>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Клиент для теста</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  disabled={!token || customersLoading}
                >
                  <option value="">Без клиента</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}{customer.company ? ` (${customer.company})` : ""}
                    </option>
                  ))}
                </select>
                {customersError ? (
                  <div className="text-xs text-red-600">{customersError}</div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold">Загрузить созвон</h3>
            <form className="space-y-3" onSubmit={handleUploadCall}>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="w-full text-sm"
                required
              />
              <input
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="Название (опционально)"
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
              />
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={uploadStartedAt}
                onChange={(event) => setUploadStartedAt(event.target.value)}
              />
              {uploadError ? (
                <div className="text-xs text-red-600">{uploadError}</div>
              ) : null}
              <button
                type="submit"
                disabled={!token || uploadLoading}
                className="w-full rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium hover:shadow-sm disabled:opacity-60"
              >
                {uploadLoading ? "Загрузка..." : "Загрузить и обработать"}
              </button>
            </form>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2 text-xs text-muted-foreground">
              Формат: mp3, wav, webm, mp4. После загрузки статус можно проверить справа.
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Статус и результат</h3>
              <button
                type="button"
                disabled={!lastCallId || statusLoading}
                onClick={() => lastCallId && loadStatus(lastCallId)}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Проверить статус
              </button>
            </div>
            {statusError ? <div className="text-xs text-red-600">{statusError}</div> : null}
            {status ? (
              <div className="space-y-3">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2 py-1 rounded-full ${
                    status.status === "completed" ? "bg-green-100 text-green-700" :
                    status.status === "failed" ? "bg-red-100 text-red-700" :
                    status.status === "processing" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {status.status === "processing" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                    {status.status === "completed" && "✓ "}
                    {status.status === "pending" && "Ожидание"}
                    {status.status === "processing" && "Обработка"}
                    {status.status === "completed" && "Готово"}
                    {status.status === "failed" && "Ошибка"}
                  </span>
                  {status.status === "processing" && elapsedSeconds > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {status.status === "processing" ? "Транскрипция Whisper..." :
                       status.status === "completed" ? "Завершено" :
                       status.status === "pending" ? "Ожидание в очереди..." : ""}
                    </span>
                    <span>
                      {status.progress != null ? `${status.progress}%` :
                       status.status === "completed" ? "100%" :
                       status.status === "processing" ? "..." : ""}
                    </span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full transition-all duration-1000 ${
                      status.status === "completed" ? "bg-green-500 w-full" :
                      status.status === "failed" ? "bg-red-500 w-1/4" :
                      status.status === "processing" ? "bg-blue-500" :
                      "bg-gray-300 w-[5%]"
                    }`}
                      style={
                        status.status === "processing" && status.progress != null
                          ? { width: `${status.progress}%` }
                          : status.status === "processing"
                          ? { width: "40%", animation: "pulse 2s infinite" }
                          : undefined
                      }
                    />
                  </div>
                </div>

                {/* Estimated time */}
                {status.status === "processing" && status.progress && status.progress > 5 && elapsedSeconds > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const pct = status.progress;
                      const elapsed = elapsedSeconds;
                      const totalEstimate = Math.floor(elapsed / (pct / 100));
                      const remaining = totalEstimate - elapsed;
                      if (remaining <= 0) return null;
                      const mins = Math.floor(remaining / 60);
                      const secs = remaining % 60;
                      return `~${mins > 0 ? `${mins} мин ` : ""}${secs} сек осталось`;
                    })()}
                  </div>
                )}

                {status.status === "processing" && !status.progress && (
                  <div className="text-xs text-muted-foreground">
                    Whisper работает на CPU — большие файлы обрабатываются в реальном времени.
                    {elapsedSeconds > 60 && ` (${Math.floor(elapsedSeconds / 60)} мин в работе)`}
                  </div>
                )}

                {status.error && (
                  <div className="text-xs text-red-600 bg-red-50 rounded p-2">{status.error}</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Статус появится после загрузки файла.</div>
            )}

            <div className="border-t border-border pt-4 space-y-2">
              <div className="text-xs text-muted-foreground">Детали созвона</div>
              {callDetailLoading ? (
                <div className="text-xs text-muted-foreground">Загрузка...</div>
              ) : callDetailError ? (
                <div className="text-xs text-red-600">{callDetailError}</div>
              ) : callDetail ? (
                <div className="space-y-2 text-sm">
                  <div className="font-medium">{callDetail.title ?? "Без названия"}</div>
                  <div className="text-xs text-muted-foreground">Статус: {callDetail.processing_status}</div>
                  {callDetail.summary ? (
                    <div className="rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed">
                      {callDetail.summary}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Саммари пока нет.</div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Выберите созвон из списка.</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Список созвонов</h3>
            <button
              type="button"
              onClick={loadCalls}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Обновить
            </button>
          </div>
          {callsError ? <div className="text-xs text-red-600">{callsError}</div> : null}
          <div className="space-y-2">
            {callsLoading ? (
              <div className="text-xs text-muted-foreground">Загрузка...</div>
            ) : calls.length === 0 ? (
              <div className="text-xs text-muted-foreground">Созвоны не найдены.</div>
            ) : (
              calls.map((call) => (
                <button
                  key={call.id}
                  type="button"
                  onClick={() => handleCallSelect(call.id)}
                  className={`w-full text-left rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary/40 transition-colors ${
                    selectedCallId === call.id ? "bg-secondary/60" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{call.title ?? "Без названия"}</span>
                    <span className="text-xs text-muted-foreground">{call.processing_status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {call.customer_name ?? "Без клиента"} · {call.source}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              Последние активности
            </h2>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Все источники
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="group p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-background/80 backdrop-blur rounded-full p-1.5 shadow-sm border border-border">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">Созвон</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                Еженедельный синк с Иваном
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                Обсудили задержки новых поставок. Иван упомянул, что им нужен план логистики на 3-й квартал к пятнице. Договорились обсудить модель ценообразования...
              </p>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>Сегодня, 10:30</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>15 мин</span>
              </div>
            </div>

            <div className="group p-5 rounded-2xl border border-border bg-card hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">Telegram</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                Тикет поддержки #492
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                Клиент спрашивает о статусе возврата заказа #12345. Команда поддержки отправила трек-номер, но клиент утверждает, что он не работает...
              </p>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>Вчера</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>12 сообщений</span>
              </div>
            </div>

            <div className="group p-5 rounded-2xl border border-border bg-card hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all cursor-pointer relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100 px-2 py-1 rounded-full">CRM</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">
                Новый лид: TechCorp
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                Добавлены контактные данные и первичные требования к контракту фулфилмента. Потенциальный объем: 500 заказов/мес.
              </p>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>2 дня назад</span>
              </div>
            </div>

            <div className="group p-5 rounded-2xl border border-dashed border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
              <div className="w-14 h-14 rounded-full bg-background shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-border">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Добавить источник</p>
                <p className="text-xs text-muted-foreground mt-1">Загрузить аудио, текст или ссылку</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
            Рекомендованные действия
          </h2>

          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shrink-0 group-hover:scale-125 transition-transform" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Написать Ивану</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Он упомянул "срочную доставку" 3 раза за последний звонок. Дедлайн близко.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0 group-hover:scale-125 transition-transform" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Риск оттока: TechCorp</p>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    Сентимент упал на 15% за последнюю неделю. Проверьте тикеты поддержки.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 opacity-90">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Инсайт дня</span>
              </div>
              <h3 className="font-bold text-xl leading-snug mb-3">
                Удовлетворенность клиентов выросла на 12%.
              </h3>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-90">
                Основной фактор: Ускорение ответов в Telegram-чатах (среднее время: 4 мин).
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold bg-white/20 w-fit px-4 py-2 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm">
                Открыть отчет &rarr;
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
