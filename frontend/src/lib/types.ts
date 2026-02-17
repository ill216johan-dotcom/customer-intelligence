/**
 * TypeScript types matching backend models
 * Customer Intelligence Platform
 */

// ==========================================
// Enums
// ==========================================

export enum CallSource {
  JITSI = "jitsi",
  BITRIX = "bitrix",
  MANUAL = "manual",
}

export enum MessageSource {
  TELEGRAM = "telegram",
  EMAIL = "email",
  BITRIX = "bitrix",
  WHATSAPP = "whatsapp",
}

export enum MessageDirection {
  INCOMING = "incoming",
  OUTGOING = "outgoing",
}

export enum AlertType {
  HIGH_RESERVES = "high_reserves",
  POTENTIAL_LEAVE = "potential_leave",
  PAYMENT_OVERDUE = "payment_overdue",
  CUSTOM = "custom",
}

export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  VIEWER = "viewer",
}

// ==========================================
// User Types
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// ==========================================
// Customer Types
// ==========================================

export interface Customer {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  telegram_id: number | null;
  telegram_username: string | null;
  products: string | null;
  marketplaces: string[] | null;
  working_since: string | null;
  pains: string | null;
  conflicts: string | null;
  wms_client_id: string | null;
  bitrix_contact_id: number | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerListItem {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  telegram_username: string | null;
  calls_count: number;
  messages_count: number;
  unread_alerts_count: number;
  last_interaction: string | null;
  created_at: string;
}

export interface CustomerCreate {
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  telegram_id?: number | null;
  telegram_username?: string | null;
  products?: string | null;
  marketplaces?: string[];
  working_since?: string | null;
  pains?: string | null;
  conflicts?: string | null;
  wms_client_id?: string | null;
  bitrix_contact_id?: number | null;
}

export interface CustomerUpdate extends Partial<CustomerCreate> {}

export interface CustomerStats {
  calls_count: number;
  messages_count: number;
  notes_count: number;
  alerts_count: number;
  unread_alerts_count: number;
}

// ==========================================
// Call Types
// ==========================================

export interface SpeakerSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface CallParticipant {
  name?: string;
  email?: string;
  role?: string;
}

export interface Call {
  id: string;
  customer_id: string | null;
  source: CallSource;
  title: string | null;
  meeting_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
  participants: CallParticipant[] | null;
  transcript: string | null;
  transcript_with_speakers: SpeakerSegment[] | null;
  summary: string | null;
  key_points: string[] | null;
  action_items: string[] | null;
  audio_url: string | null;
  audio_filename: string | null;
  processing_status: string;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallListItem {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  source: CallSource;
  title: string | null;
  started_at: string;
  duration: number | null;
  processing_status: string;
  has_summary: boolean;
  created_at: string;
}

export interface CallCreate {
  customer_id?: string | null;
  source?: CallSource;
  title?: string | null;
  meeting_id?: string | null;
  started_at: string;
  ended_at?: string | null;
  participants?: CallParticipant[];
}

export interface TranscriptionStatus {
  call_id: string;
  status: string;
  progress: number | null;
  error: string | null;
}

// ==========================================
// Message Types
// ==========================================

export interface Message {
  id: string;
  customer_id: string | null;
  source: MessageSource;
  direction: MessageDirection;
  sender_name: string | null;
  sender_id: string | null;
  content: string;
  chat_id: string | null;
  thread_id: string | null;
  sent_at: string;
  created_at: string;
}

export interface MessageCreate {
  customer_id?: string | null;
  source: MessageSource;
  direction: MessageDirection;
  sender_name?: string | null;
  sender_id?: string | null;
  content: string;
  chat_id?: string | null;
  thread_id?: string | null;
  sent_at: string;
  raw_data?: Record<string, unknown> | null;
}

export interface ChatSummary {
  chat_id: string;
  customer_id: string | null;
  customer_name: string | null;
  source: MessageSource;
  message_count: number;
  last_message_at: string;
  participants: string[];
}

// ==========================================
// Note Types
// ==========================================

export interface Note {
  id: string;
  customer_id: string;
  author_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  customer_id: string;
  content: string;
}

export interface NoteUpdate {
  content: string;
}

// ==========================================
// Alert Types
// ==========================================

export interface Alert {
  id: string;
  customer_id: string;
  customer_name: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string | null;
  trigger_data: Record<string, unknown> | null;
  is_read: boolean;
  read_by: string | null;
  read_at: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface AlertCreate {
  customer_id: string;
  type: AlertType;
  severity?: AlertSeverity;
  title: string;
  message?: string | null;
  trigger_data?: Record<string, unknown> | null;
}

export interface AlertResolve {
  resolution_note?: string | null;
}

export interface AlertStats {
  total: number;
  unread: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
}

// ==========================================
// Chat (RAG) Types
// ==========================================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  customer_id: string;
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface ChatSource {
  type: "call" | "message" | "note";
  content: string;
  date: string | null;
  similarity: number;
}

// ==========================================
// Activity (Combined) Types
// ==========================================

export type ActivityType = "call" | "message" | "note" | "alert";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  customer_id?: string;
  customer_name?: string;
  metadata?: Record<string, unknown>;
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiError {
  detail: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface BulkCreateResponse {
  created: number;
}

export interface MessageResponse {
  message: string;
}
