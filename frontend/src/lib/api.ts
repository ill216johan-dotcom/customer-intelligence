"use client";

/**
 * API Client for Customer Intelligence Platform
 * Handles all backend API communication with JWT auth
 */

import type {
  Token,
  User,
  Customer,
  CustomerListItem,
  CustomerCreate,
  CustomerUpdate,
  CustomerStats,
  Call,
  CallListItem,
  CallCreate,
  CallSource,
  TranscriptionStatus,
  Message,
  MessageCreate,
  MessageSource,
  ChatSummary,
  Note,
  NoteCreate,
  NoteUpdate,
  Alert,
  AlertCreate,
  AlertResolve,
  AlertStats,
  AlertType,
  AlertSeverity,
  ChatRequest,
  ChatResponse,
  ChatSource,
  BulkCreateResponse,
  MessageResponse,
} from "./types";

// ==========================================
// Configuration
// ==========================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "ci_access_token";

// ==========================================
// Token Management
// ==========================================

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ==========================================
// Base Fetch Wrapper
// ==========================================

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 - clear token and redirect to login
  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }

  // Handle errors
  if (!response.ok) {
    let detail = "An error occurred";
    try {
      const errorData = await response.json();
      detail = errorData.detail || detail;
    } catch {
      detail = response.statusText;
    }
    throw new ApiError(response.status, detail);
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }

  return response.json();
}

// File upload helper (multipart/form-data)
async function apiUpload<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (!response.ok) {
    let detail = "Upload failed";
    try {
      const errorData = await response.json();
      detail = errorData.detail || detail;
    } catch {
      detail = response.statusText;
    }
    throw new ApiError(response.status, detail);
  }

  return response.json();
}

// ==========================================
// Auth API
// ==========================================

export async function login(
  email: string,
  password: string
): Promise<Token> {
  // OAuth2 password flow uses form data
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    let detail = "Login failed";
    try {
      const errorData = await response.json();
      detail = errorData.detail || detail;
    } catch {
      detail = response.statusText;
    }
    throw new ApiError(response.status, detail);
  }

  const data: Token = await response.json();
  setToken(data.access_token);
  return data;
}

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/api/auth/me");
}

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role?: string;
}): Promise<User> {
  return apiFetch<User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logout(): void {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// ==========================================
// Customers API
// ==========================================

export async function getCustomers(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<CustomerListItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append("search", params.search);
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.offset) searchParams.append("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<CustomerListItem[]>(`/api/customers${query ? `?${query}` : ""}`);
}

export async function getCustomer(customerId: string): Promise<Customer> {
  return apiFetch<Customer>(`/api/customers/${customerId}`);
}

export async function getCustomerStats(customerId: string): Promise<CustomerStats> {
  return apiFetch<CustomerStats>(`/api/customers/${customerId}/stats`);
}

export async function createCustomer(data: CustomerCreate): Promise<Customer> {
  return apiFetch<Customer>("/api/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(
  customerId: string,
  data: CustomerUpdate
): Promise<Customer> {
  return apiFetch<Customer>(`/api/customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(customerId: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/customers/${customerId}`, {
    method: "DELETE",
  });
}

// ==========================================
// Calls API
// ==========================================

export async function getCalls(params?: {
  customer_id?: string;
  source?: CallSource;
  limit?: number;
  offset?: number;
}): Promise<CallListItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.customer_id) searchParams.append("customer_id", params.customer_id);
  if (params?.source) searchParams.append("source", params.source);
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.offset) searchParams.append("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<CallListItem[]>(`/api/calls${query ? `?${query}` : ""}`);
}

export async function getCall(callId: string): Promise<Call> {
  return apiFetch<Call>(`/api/calls/${callId}`);
}

export async function createCall(data: CallCreate): Promise<Call> {
  return apiFetch<Call>("/api/calls", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadAudio(
  file: File,
  options?: {
    customer_id?: string;
    title?: string;
    started_at?: string;
  }
): Promise<Call> {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.customer_id) formData.append("customer_id", options.customer_id);
  if (options?.title) formData.append("title", options.title);
  if (options?.started_at) formData.append("started_at", options.started_at);

  return apiUpload<Call>("/api/calls/upload", formData);
}

export async function getTranscriptionStatus(
  callId: string
): Promise<TranscriptionStatus> {
  return apiFetch<TranscriptionStatus>(`/api/calls/${callId}/status`);
}

export async function reprocessCall(callId: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/calls/${callId}/reprocess`, {
    method: "POST",
  });
}

export async function assignCallToCustomer(
  callId: string,
  customerId: string
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(
    `/api/calls/${callId}/customer?customer_id=${customerId}`,
    { method: "PUT" }
  );
}

export async function deleteCall(callId: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/calls/${callId}`, {
    method: "DELETE",
  });
}

// ==========================================
// Messages API
// ==========================================

export async function getMessages(params?: {
  customer_id?: string;
  chat_id?: string;
  source?: MessageSource;
  limit?: number;
  offset?: number;
}): Promise<Message[]> {
  const searchParams = new URLSearchParams();
  if (params?.customer_id) searchParams.append("customer_id", params.customer_id);
  if (params?.chat_id) searchParams.append("chat_id", params.chat_id);
  if (params?.source) searchParams.append("source", params.source);
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.offset) searchParams.append("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<Message[]>(`/api/messages${query ? `?${query}` : ""}`);
}

export async function getChats(params?: {
  source?: MessageSource;
  limit?: number;
}): Promise<ChatSummary[]> {
  const searchParams = new URLSearchParams();
  if (params?.source) searchParams.append("source", params.source);
  if (params?.limit) searchParams.append("limit", params.limit.toString());

  const query = searchParams.toString();
  return apiFetch<ChatSummary[]>(`/api/messages/chats${query ? `?${query}` : ""}`);
}

export async function getChatMessages(
  chatId: string,
  params?: {
    limit?: number;
    before?: string;
  }
): Promise<Message[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.before) searchParams.append("before", params.before);

  const query = searchParams.toString();
  return apiFetch<Message[]>(
    `/api/messages/chat/${encodeURIComponent(chatId)}${query ? `?${query}` : ""}`
  );
}

export async function createMessage(data: MessageCreate): Promise<Message> {
  return apiFetch<Message>("/api/messages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createMessagesBulk(
  messages: MessageCreate[]
): Promise<BulkCreateResponse> {
  return apiFetch<BulkCreateResponse>("/api/messages/bulk", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}

export async function assignMessageToCustomer(
  messageId: string,
  customerId: string
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(
    `/api/messages/${messageId}/customer?customer_id=${customerId}`,
    { method: "PUT" }
  );
}

export async function assignChatToCustomer(
  chatId: string,
  customerId: string
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(
    `/api/messages/chat/${encodeURIComponent(chatId)}/customer?customer_id=${customerId}`,
    { method: "PUT" }
  );
}

export async function deleteMessage(messageId: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/messages/${messageId}`, {
    method: "DELETE",
  });
}

// ==========================================
// Notes API
// ==========================================

export async function getNotes(params?: {
  customer_id?: string;
  limit?: number;
  offset?: number;
}): Promise<Note[]> {
  const searchParams = new URLSearchParams();
  if (params?.customer_id) searchParams.append("customer_id", params.customer_id);
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.offset) searchParams.append("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<Note[]>(`/api/notes${query ? `?${query}` : ""}`);
}

export async function getNote(noteId: string): Promise<Note> {
  return apiFetch<Note>(`/api/notes/${noteId}`);
}

export async function createNote(data: NoteCreate): Promise<Note> {
  return apiFetch<Note>("/api/notes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateNote(
  noteId: string,
  data: NoteUpdate
): Promise<Note> {
  return apiFetch<Note>(`/api/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(noteId: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/notes/${noteId}`, {
    method: "DELETE",
  });
}

// ==========================================
// Alerts API
// ==========================================

export async function getAlerts(params?: {
  customer_id?: string;
  type?: AlertType;
  severity?: AlertSeverity;
  is_read?: boolean;
  is_resolved?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Alert[]> {
  const searchParams = new URLSearchParams();
  if (params?.customer_id) searchParams.append("customer_id", params.customer_id);
  if (params?.type) searchParams.append("type", params.type);
  if (params?.severity) searchParams.append("severity", params.severity);
  if (params?.is_read !== undefined)
    searchParams.append("is_read", params.is_read.toString());
  if (params?.is_resolved !== undefined)
    searchParams.append("is_resolved", params.is_resolved.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.offset) searchParams.append("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<Alert[]>(`/api/alerts${query ? `?${query}` : ""}`);
}

export async function getAlertStats(): Promise<AlertStats> {
  return apiFetch<AlertStats>("/api/alerts/stats");
}

export async function getAlert(alertId: string): Promise<Alert> {
  return apiFetch<Alert>(`/api/alerts/${alertId}`);
}

export async function createAlert(data: AlertCreate): Promise<Alert> {
  return apiFetch<Alert>("/api/alerts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function markAlertAsRead(alertId: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/alerts/${alertId}/read`, {
    method: "POST",
  });
}

export async function resolveAlert(
  alertId: string,
  data?: AlertResolve
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/alerts/${alertId}/resolve`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

export async function deleteAlert(alertId: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/alerts/${alertId}`, {
    method: "DELETE",
  });
}

// ==========================================
// Chat (RAG) API
// ==========================================

export async function chatWithCustomerData(
  data: ChatRequest
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCustomerContext(
  customerId: string,
  query: string,
  limit?: number
): Promise<{ query: string; context: ChatSource[] }> {
  const searchParams = new URLSearchParams();
  searchParams.append("query", query);
  if (limit) searchParams.append("limit", limit.toString());

  return apiFetch(`/api/chat/${customerId}/context?${searchParams.toString()}`);
}

// ==========================================
// Export Error Class
// ==========================================

export { ApiError };
