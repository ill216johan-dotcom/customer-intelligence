/**
 * Mock data for development
 * Russian language content for fulfilment business context
 */

import {
  type CustomerListItem,
  type Customer,
  type CallListItem,
  type Call,
  type Alert,
  type Message,
  type Note,
  type Activity,
  CallSource,
  MessageSource,
  MessageDirection,
  AlertType,
  AlertSeverity,
} from "./types";

// ==========================================
// UUIDs
// ==========================================

export const CUSTOMER_IDS = {
  ivan: "c7b3d8e0-5a4b-4c6d-9e8f-1a2b3c4d5e6f",
  maria: "d8c4e9f1-6b5c-5d7e-0f9g-2b3c4d5e6f7a",
  alexey: "e9d5f0a2-7c6d-6e8f-1g0h-3c4d5e6f7a8b",
  elena: "f0e6a1b3-8d7e-7f9g-2h1i-4d5e6f7a8b9c",
  sergey: "a1f7b2c4-9e8f-8g0h-3i2j-5e6f7a8b9c0d",
} as const;

export const CALL_IDS = {
  call1: "b2a8c3d5-0f9g-9h1i-4j3k-6f7a8b9c0d1e",
  call2: "c3b9d4e6-1g0h-0i2j-5k4l-7a8b9c0d1e2f",
  call3: "d4c0e5f7-2h1i-1j3k-6l5m-8b9c0d1e2f3a",
  call4: "e5d1f6a8-3i2j-2k4l-7m6n-9c0d1e2f3a4b",
  call5: "f6e2a7b9-4j3k-3l5m-8n7o-0d1e2f3a4b5c",
  call6: "a7f3b8c0-5k4l-4m6n-9o8p-1e2f3a4b5c6d",
  call7: "b8a4c9d1-6l5m-5n7o-0p9q-2f3a4b5c6d7e",
  call8: "c9b5d0e2-7m6n-6o8p-1q0r-3a4b5c6d7e8f",
} as const;

export const ALERT_IDS = {
  alert1: "d0c6e1f3-8n7o-7p9q-2r1s-4b5c6d7e8f9a",
  alert2: "e1d7f2a4-9o8p-8q0r-3s2t-5c6d7e8f9a0b",
  alert3: "f2e8a3b5-0p9q-9r1s-4t3u-6d7e8f9a0b1c",
  alert4: "a3f9b4c6-1q0r-0s2t-5u4v-7e8f9a0b1c2d",
  alert5: "b4a0c5d7-2r1s-1t3u-6v5w-8f9a0b1c2d3e",
  alert6: "c5b1d6e8-3s2t-2u4v-7w6x-9a0b1c2d3e4f",
} as const;

export const MESSAGE_IDS = {
  msg1: "d6c2e7f9-4t3u-3v5w-8x7y-0b1c2d3e4f5a",
  msg2: "e7d3f8a0-5u4v-4w6x-9y8z-1c2d3e4f5a6b",
  msg3: "f8e4a9b1-6v5w-5x7y-0z9a-2d3e4f5a6b7c",
  msg4: "a9f5b0c2-7w6x-6y8z-1a0b-3e4f5a6b7c8d",
  msg5: "b0a6c1d3-8x7y-7z9a-2b1c-4f5a6b7c8d9e",
  msg6: "c1b7d2e4-9y8z-8a0b-3c2d-5a6b7c8d9e0f",
  msg7: "d2c8e3f5-0z9a-9b1c-4d3e-6b7c8d9e0f1a",
  msg8: "e3d9f4a6-1a0b-0c2d-5e4f-7c8d9e0f1a2b",
  msg9: "f4e0a5b7-2b1c-1d3e-6f5a-8d9e0f1a2b3c",
  msg10: "a5f1b6c8-3c2d-2e4f-7a6b-9e0f1a2b3c4d",
} as const;

export const NOTE_IDS = {
  note1: "b6a2c7d9-4d3e-3f5a-8b7c-0f1a2b3c4d5e",
  note2: "c7b3d8e0-5e4f-4a6b-9c8d-1a2b3c4d5e6f",
  note3: "d8c4e9f1-6f5a-5b7c-0d9e-2b3c4d5e6f7a",
  note4: "e9d5f0a2-7a6b-6c8d-1e0f-3c4d5e6f7a8b",
} as const;

export const USER_IDS = {
  admin: "f0e6a1b3-8b7c-7d9e-2f1a-4d5e6f7a8b9c",
  manager: "a1f7b2c4-9c8d-8e0f-3a2b-5e6f7a8b9c0d",
} as const;

// ==========================================
// Mock Customers
// ==========================================

export const mockCustomersListItems: CustomerListItem[] = [
  {
    id: CUSTOMER_IDS.ivan,
    name: "Иван Петров",
    company: "ООО \"СеллерПро\"",
    phone: "+7 (903) 123-45-67",
    email: "ivan@sellerpro.ru",
    telegram_username: "ivan_sellerpro",
    calls_count: 12,
    messages_count: 45,
    unread_alerts_count: 2,
    last_interaction: "2026-02-17T10:30:00Z",
    created_at: "2025-06-15T09:00:00Z",
  },
  {
    id: CUSTOMER_IDS.maria,
    name: "Мария Сидорова",
    company: "ИП Сидорова М.А.",
    phone: "+7 (916) 234-56-78",
    email: "maria@ozonmaster.ru",
    telegram_username: "maria_ozon",
    calls_count: 8,
    messages_count: 67,
    unread_alerts_count: 0,
    last_interaction: "2026-02-16T15:45:00Z",
    created_at: "2025-08-22T11:30:00Z",
  },
  {
    id: CUSTOMER_IDS.alexey,
    name: "Алексей Козлов",
    company: "TechCorp Solutions",
    phone: "+7 (925) 345-67-89",
    email: "a.kozlov@techcorp.ru",
    telegram_username: "alexey_tech",
    calls_count: 5,
    messages_count: 23,
    unread_alerts_count: 1,
    last_interaction: "2026-02-15T14:20:00Z",
    created_at: "2025-11-03T14:00:00Z",
  },
  {
    id: CUSTOMER_IDS.elena,
    name: "Елена Волкова",
    company: "Модный Дом \"Стиль\"",
    phone: "+7 (929) 456-78-90",
    email: "elena@stylehouse.ru",
    telegram_username: "elena_style",
    calls_count: 15,
    messages_count: 89,
    unread_alerts_count: 0,
    last_interaction: "2026-02-17T09:15:00Z",
    created_at: "2025-04-10T10:00:00Z",
  },
  {
    id: CUSTOMER_IDS.sergey,
    name: "Сергей Новиков",
    company: "ООО \"ЭкоТовары\"",
    phone: "+7 (905) 567-89-01",
    email: "s.novikov@ecotovary.ru",
    telegram_username: "sergey_eco",
    calls_count: 3,
    messages_count: 12,
    unread_alerts_count: 3,
    last_interaction: "2026-02-14T16:30:00Z",
    created_at: "2026-01-08T09:30:00Z",
  },
];

export const mockCustomers: Record<string, Customer> = {
  [CUSTOMER_IDS.ivan]: {
    id: CUSTOMER_IDS.ivan,
    name: "Иван Петров",
    company: "ООО \"СеллерПро\"",
    phone: "+7 (903) 123-45-67",
    email: "ivan@sellerpro.ru",
    telegram_id: 123456789,
    telegram_username: "ivan_sellerpro",
    products: "Электроника, аксессуары для смартфонов, зарядные устройства",
    marketplaces: ["wildberries", "ozon"],
    working_since: "2025-06-15",
    pains: "Частые задержки поставок, высокие комиссии WB",
    conflicts: null,
    wms_client_id: "CLI-001",
    bitrix_contact_id: 12345,
    ai_summary: "Активный клиент с растущим оборотом. Основная категория - электроника. Требует внимания к срокам доставки.",
    created_at: "2025-06-15T09:00:00Z",
    updated_at: "2026-02-17T10:30:00Z",
  },
  [CUSTOMER_IDS.maria]: {
    id: CUSTOMER_IDS.maria,
    name: "Мария Сидорова",
    company: "ИП Сидорова М.А.",
    phone: "+7 (916) 234-56-78",
    email: "maria@ozonmaster.ru",
    telegram_id: 234567890,
    telegram_username: "maria_ozon",
    products: "Товары для дома, посуда, декор",
    marketplaces: ["ozon"],
    working_since: "2025-08-22",
    pains: "Сложности с фотоконтентом, нужна помощь с карточками",
    conflicts: null,
    wms_client_id: "CLI-002",
    bitrix_contact_id: 12346,
    ai_summary: "Стабильный клиент, работает только с Ozon. Лояльна, рекомендует нас партнёрам.",
    created_at: "2025-08-22T11:30:00Z",
    updated_at: "2026-02-16T15:45:00Z",
  },
  [CUSTOMER_IDS.alexey]: {
    id: CUSTOMER_IDS.alexey,
    name: "Алексей Козлов",
    company: "TechCorp Solutions",
    phone: "+7 (925) 345-67-89",
    email: "a.kozlov@techcorp.ru",
    telegram_id: 345678901,
    telegram_username: "alexey_tech",
    products: "IT-оборудование, серверы, комплектующие",
    marketplaces: ["ozon", "yandex_market"],
    working_since: "2025-11-03",
    pains: "Требуется хранение крупногабаритных товаров",
    conflicts: "Был инцидент с повреждением партии в ноябре 2025",
    wms_client_id: "CLI-003",
    bitrix_contact_id: 12347,
    ai_summary: "Новый клиент с высоким потенциалом. Требует особого внимания после инцидента с повреждением.",
    created_at: "2025-11-03T14:00:00Z",
    updated_at: "2026-02-15T14:20:00Z",
  },
  [CUSTOMER_IDS.elena]: {
    id: CUSTOMER_IDS.elena,
    name: "Елена Волкова",
    company: "Модный Дом \"Стиль\"",
    phone: "+7 (929) 456-78-90",
    email: "elena@stylehouse.ru",
    telegram_id: 456789012,
    telegram_username: "elena_style",
    products: "Женская одежда, аксессуары, сумки",
    marketplaces: ["wildberries", "ozon", "lamoda"],
    working_since: "2025-04-10",
    pains: "Сезонность продаж, большие возвраты",
    conflicts: null,
    wms_client_id: "CLI-004",
    bitrix_contact_id: 12348,
    ai_summary: "VIP-клиент с большим оборотом. Fashion-сегмент требует быстрой обработки и особого хранения.",
    created_at: "2025-04-10T10:00:00Z",
    updated_at: "2026-02-17T09:15:00Z",
  },
  [CUSTOMER_IDS.sergey]: {
    id: CUSTOMER_IDS.sergey,
    name: "Сергей Новиков",
    company: "ООО \"ЭкоТовары\"",
    phone: "+7 (905) 567-89-01",
    email: "s.novikov@ecotovary.ru",
    telegram_id: 567890123,
    telegram_username: "sergey_eco",
    products: "Эко-товары, органическая косметика, БАДы",
    marketplaces: ["wildberries"],
    working_since: "2026-01-08",
    pains: "Требуется сертификация, сложная логистика для хрупких товаров",
    conflicts: null,
    wms_client_id: "CLI-005",
    bitrix_contact_id: 12349,
    ai_summary: "Новый перспективный клиент. Эко-сегмент растёт. Требует особых условий хранения.",
    created_at: "2026-01-08T09:30:00Z",
    updated_at: "2026-02-14T16:30:00Z",
  },
};

// ==========================================
// Mock Calls (Activities)
// ==========================================

export const mockCallsListItems: CallListItem[] = [
  {
    id: CALL_IDS.call1,
    customer_id: CUSTOMER_IDS.ivan,
    customer_name: "Иван Петров",
    source: CallSource.MANUAL,
    title: "Еженедельный синк с Иваном",
    started_at: "2026-02-17T10:30:00Z",
    duration: 900, // 15 min
    processing_status: "completed",
    has_summary: true,
    created_at: "2026-02-17T10:30:00Z",
  },
  {
    id: CALL_IDS.call2,
    customer_id: CUSTOMER_IDS.elena,
    customer_name: "Елена Волкова",
    source: CallSource.JITSI,
    title: "Обсуждение весенней коллекции",
    started_at: "2026-02-17T09:00:00Z",
    duration: 1800, // 30 min
    processing_status: "completed",
    has_summary: true,
    created_at: "2026-02-17T09:00:00Z",
  },
  {
    id: CALL_IDS.call3,
    customer_id: CUSTOMER_IDS.maria,
    customer_name: "Мария Сидорова",
    source: CallSource.BITRIX,
    title: "Вопросы по отгрузке",
    started_at: "2026-02-16T15:30:00Z",
    duration: 600, // 10 min
    processing_status: "completed",
    has_summary: true,
    created_at: "2026-02-16T15:30:00Z",
  },
  {
    id: CALL_IDS.call4,
    customer_id: CUSTOMER_IDS.alexey,
    customer_name: "Алексей Козлов",
    source: CallSource.MANUAL,
    title: "Разбор инцидента с повреждением",
    started_at: "2026-02-15T14:00:00Z",
    duration: 2700, // 45 min
    processing_status: "completed",
    has_summary: true,
    created_at: "2026-02-15T14:00:00Z",
  },
  {
    id: CALL_IDS.call5,
    customer_id: CUSTOMER_IDS.ivan,
    customer_name: "Иван Петров",
    source: CallSource.JITSI,
    title: "Планирование Q1 2026",
    started_at: "2026-02-10T11:00:00Z",
    duration: 3600, // 60 min
    processing_status: "completed",
    has_summary: true,
    created_at: "2026-02-10T11:00:00Z",
  },
  {
    id: CALL_IDS.call6,
    customer_id: CUSTOMER_IDS.sergey,
    customer_name: "Сергей Новиков",
    source: CallSource.MANUAL,
    title: "Онбординг нового клиента",
    started_at: "2026-01-08T10:00:00Z",
    duration: 2400, // 40 min
    processing_status: "completed",
    has_summary: true,
    created_at: "2026-01-08T10:00:00Z",
  },
  {
    id: CALL_IDS.call7,
    customer_id: null,
    customer_name: null,
    source: CallSource.MANUAL,
    title: "Входящий звонок (не определён)",
    started_at: "2026-02-16T12:00:00Z",
    duration: 180, // 3 min
    processing_status: "pending",
    has_summary: false,
    created_at: "2026-02-16T12:00:00Z",
  },
  {
    id: CALL_IDS.call8,
    customer_id: CUSTOMER_IDS.elena,
    customer_name: "Елена Волкова",
    source: CallSource.BITRIX,
    title: "Срочный вопрос по возвратам",
    started_at: "2026-02-14T16:00:00Z",
    duration: 420, // 7 min
    processing_status: "completed",
    has_summary: true,
    created_at: "2026-02-14T16:00:00Z",
  },
];

// ==========================================
// Mock Alerts
// ==========================================

export const mockAlerts: Alert[] = [
  {
    id: ALERT_IDS.alert1,
    customer_id: CUSTOMER_IDS.ivan,
    customer_name: "Иван Петров",
    type: AlertType.PAYMENT_OVERDUE,
    severity: AlertSeverity.HIGH,
    title: "Просрочка оплаты",
    message: "Счёт №1234 от 01.02.2026 не оплачен. Сумма: 125,000 руб. Просрочка: 14 дней.",
    trigger_data: { invoice_id: "1234", amount: 125000, days_overdue: 14 },
    is_read: false,
    read_by: null,
    read_at: null,
    is_resolved: false,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: "2026-02-15T09:00:00Z",
  },
  {
    id: ALERT_IDS.alert2,
    customer_id: CUSTOMER_IDS.alexey,
    customer_name: "Алексей Козлов",
    type: AlertType.POTENTIAL_LEAVE,
    severity: AlertSeverity.CRITICAL,
    title: "Риск ухода клиента",
    message: "Сентимент снизился на 15% за последнюю неделю. Клиент упоминал конкурентов в переписке.",
    trigger_data: { sentiment_drop: 15, competitor_mentions: ["FulfilPro", "Склад24"] },
    is_read: false,
    read_by: null,
    read_at: null,
    is_resolved: false,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: "2026-02-16T11:30:00Z",
  },
  {
    id: ALERT_IDS.alert3,
    customer_id: CUSTOMER_IDS.ivan,
    customer_name: "Иван Петров",
    type: AlertType.CUSTOM,
    severity: AlertSeverity.MEDIUM,
    title: "Упоминание срочной доставки",
    message: "Клиент упомянул \"срочную доставку\" 3 раза за последний звонок. Рекомендуется связаться.",
    trigger_data: { keyword: "срочная доставка", mentions: 3 },
    is_read: true,
    read_by: USER_IDS.manager,
    read_at: "2026-02-17T08:00:00Z",
    is_resolved: false,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: "2026-02-17T07:30:00Z",
  },
  {
    id: ALERT_IDS.alert4,
    customer_id: CUSTOMER_IDS.sergey,
    customer_name: "Сергей Новиков",
    type: AlertType.HIGH_RESERVES,
    severity: AlertSeverity.MEDIUM,
    title: "Высокие резервы на складе",
    message: "Товары клиента занимают 150% от договорного объёма. Требуется согласование.",
    trigger_data: { current_volume: 150, contract_volume: 100 },
    is_read: false,
    read_by: null,
    read_at: null,
    is_resolved: false,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: "2026-02-14T14:00:00Z",
  },
  {
    id: ALERT_IDS.alert5,
    customer_id: CUSTOMER_IDS.sergey,
    customer_name: "Сергей Новиков",
    type: AlertType.CUSTOM,
    severity: AlertSeverity.LOW,
    title: "Требуется обновление сертификатов",
    message: "Сертификаты на эко-товары истекают 01.03.2026. Напомните клиенту.",
    trigger_data: { certificate_expiry: "2026-03-01" },
    is_read: false,
    read_by: null,
    read_at: null,
    is_resolved: false,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: "2026-02-10T09:00:00Z",
  },
  {
    id: ALERT_IDS.alert6,
    customer_id: CUSTOMER_IDS.sergey,
    customer_name: "Сергей Новиков",
    type: AlertType.PAYMENT_OVERDUE,
    severity: AlertSeverity.HIGH,
    title: "Задержка первого платежа",
    message: "Первый платёж за услуги не поступил. Сумма: 50,000 руб. Просрочка: 5 дней.",
    trigger_data: { invoice_id: "1289", amount: 50000, days_overdue: 5 },
    is_read: false,
    read_by: null,
    read_at: null,
    is_resolved: false,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: "2026-02-13T10:00:00Z",
  },
];

// ==========================================
// Mock Messages
// ==========================================

export const mockMessages: Message[] = [
  {
    id: MESSAGE_IDS.msg1,
    customer_id: CUSTOMER_IDS.ivan,
    source: MessageSource.TELEGRAM,
    direction: MessageDirection.INCOMING,
    sender_name: "Иван Петров",
    sender_id: "123456789",
    content: "Добрый день! Когда будет готова следующая отгрузка? Нужно срочно пополнить склад WB.",
    chat_id: "chat_ivan_001",
    thread_id: null,
    sent_at: "2026-02-17T09:30:00Z",
    created_at: "2026-02-17T09:30:05Z",
  },
  {
    id: MESSAGE_IDS.msg2,
    customer_id: CUSTOMER_IDS.ivan,
    source: MessageSource.TELEGRAM,
    direction: MessageDirection.OUTGOING,
    sender_name: "Менеджер",
    sender_id: "manager_001",
    content: "Здравствуйте, Иван! Отгрузка запланирована на завтра, 18 февраля. Ориентировочно в 14:00.",
    chat_id: "chat_ivan_001",
    thread_id: null,
    sent_at: "2026-02-17T09:35:00Z",
    created_at: "2026-02-17T09:35:02Z",
  },
  {
    id: MESSAGE_IDS.msg3,
    customer_id: CUSTOMER_IDS.ivan,
    source: MessageSource.TELEGRAM,
    direction: MessageDirection.INCOMING,
    sender_name: "Иван Петров",
    sender_id: "123456789",
    content: "Отлично, спасибо! А можно добавить в эту отгрузку ещё 50 позиций артикула A-123?",
    chat_id: "chat_ivan_001",
    thread_id: null,
    sent_at: "2026-02-17T09:40:00Z",
    created_at: "2026-02-17T09:40:03Z",
  },
  {
    id: MESSAGE_IDS.msg4,
    customer_id: CUSTOMER_IDS.maria,
    source: MessageSource.TELEGRAM,
    direction: MessageDirection.INCOMING,
    sender_name: "Мария Сидорова",
    sender_id: "234567890",
    content: "Привет! У меня вопрос по возврату заказа #12345. Клиент утверждает, что товар повреждён.",
    chat_id: "chat_maria_001",
    thread_id: null,
    sent_at: "2026-02-16T14:20:00Z",
    created_at: "2026-02-16T14:20:05Z",
  },
  {
    id: MESSAGE_IDS.msg5,
    customer_id: CUSTOMER_IDS.maria,
    source: MessageSource.EMAIL,
    direction: MessageDirection.INCOMING,
    sender_name: "Мария Сидорова",
    sender_id: "maria@ozonmaster.ru",
    content: "Добрый день! Прошу выслать акт сверки за январь 2026 года. Спасибо!",
    chat_id: null,
    thread_id: "thread_maria_email_001",
    sent_at: "2026-02-15T10:00:00Z",
    created_at: "2026-02-15T10:00:10Z",
  },
  {
    id: MESSAGE_IDS.msg6,
    customer_id: CUSTOMER_IDS.alexey,
    source: MessageSource.TELEGRAM,
    direction: MessageDirection.INCOMING,
    sender_name: "Алексей Козлов",
    sender_id: "345678901",
    content: "По поводу инцидента с повреждённой партией - нам нужна официальная позиция. Без этого не можем закрыть вопрос со страховой.",
    chat_id: "chat_alexey_001",
    thread_id: null,
    sent_at: "2026-02-15T11:00:00Z",
    created_at: "2026-02-15T11:00:08Z",
  },
  {
    id: MESSAGE_IDS.msg7,
    customer_id: CUSTOMER_IDS.elena,
    source: MessageSource.WHATSAPP,
    direction: MessageDirection.INCOMING,
    sender_name: "Елена Волкова",
    sender_id: "+79294567890",
    content: "Срочно! Нужно приостановить отгрузку размеров XS и XXL - они закончились у поставщика.",
    chat_id: "chat_elena_wa_001",
    thread_id: null,
    sent_at: "2026-02-17T08:45:00Z",
    created_at: "2026-02-17T08:45:03Z",
  },
  {
    id: MESSAGE_IDS.msg8,
    customer_id: CUSTOMER_IDS.elena,
    source: MessageSource.WHATSAPP,
    direction: MessageDirection.OUTGOING,
    sender_name: "Менеджер",
    sender_id: "manager_wa",
    content: "Елена, приняла! Приостанавливаем. Когда ожидаете поступление?",
    chat_id: "chat_elena_wa_001",
    thread_id: null,
    sent_at: "2026-02-17T08:50:00Z",
    created_at: "2026-02-17T08:50:02Z",
  },
  {
    id: MESSAGE_IDS.msg9,
    customer_id: CUSTOMER_IDS.sergey,
    source: MessageSource.TELEGRAM,
    direction: MessageDirection.INCOMING,
    sender_name: "Сергей Новиков",
    sender_id: "567890123",
    content: "Здравствуйте! Подскажите, есть ли у вас опыт работы с БАДами? Какие условия хранения можете обеспечить?",
    chat_id: "chat_sergey_001",
    thread_id: null,
    sent_at: "2026-01-05T12:00:00Z",
    created_at: "2026-01-05T12:00:05Z",
  },
  {
    id: MESSAGE_IDS.msg10,
    customer_id: CUSTOMER_IDS.sergey,
    source: MessageSource.EMAIL,
    direction: MessageDirection.OUTGOING,
    sender_name: "Отдел продаж",
    sender_id: "sales@fulfil.ru",
    content: "Уважаемый Сергей! Направляем вам коммерческое предложение на услуги фулфилмента эко-товаров. Во вложении подробные условия.",
    chat_id: null,
    thread_id: "thread_sergey_email_001",
    sent_at: "2026-01-06T09:30:00Z",
    created_at: "2026-01-06T09:30:15Z",
  },
];

// ==========================================
// Mock Notes
// ==========================================

export const mockNotes: Note[] = [
  {
    id: NOTE_IDS.note1,
    customer_id: CUSTOMER_IDS.ivan,
    author_id: USER_IDS.manager,
    author_name: "Анна Менеджер",
    content: "Иван планирует расширять ассортимент в марте. Хочет добавить категорию 'умные часы'. Нужно подготовить КП на увеличение объёмов хранения.",
    created_at: "2026-02-10T14:00:00Z",
    updated_at: "2026-02-10T14:00:00Z",
  },
  {
    id: NOTE_IDS.note2,
    customer_id: CUSTOMER_IDS.alexey,
    author_id: USER_IDS.admin,
    author_name: "Администратор",
    content: "ВАЖНО: По инциденту с повреждением - виновник установлен (транспортная компания). Страховой случай подтверждён. Ждём выплату до конца февраля.",
    created_at: "2026-02-15T16:00:00Z",
    updated_at: "2026-02-15T16:30:00Z",
  },
  {
    id: NOTE_IDS.note3,
    customer_id: CUSTOMER_IDS.elena,
    author_id: USER_IDS.manager,
    author_name: "Анна Менеджер",
    content: "Елена - ключевой клиент. День рождения 15 марта. Подготовить подарок и поздравление. Любит цветы и шоколад.",
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-02-01T10:00:00Z",
  },
  {
    id: NOTE_IDS.note4,
    customer_id: CUSTOMER_IDS.sergey,
    author_id: USER_IDS.manager,
    author_name: "Анна Менеджер",
    content: "Новый клиент, пришёл по рекомендации от Елены Волковой. Дать скидку 5% на первые 3 месяца как бонус за рекомендацию.",
    created_at: "2026-01-08T11:00:00Z",
    updated_at: "2026-01-08T11:00:00Z",
  },
];

// ==========================================
// Mock Activities (Combined Feed)
// ==========================================

export const mockActivities: Activity[] = [
  {
    id: CALL_IDS.call1,
    type: "call",
    title: "Еженедельный синк с Иваном",
    description: "Обсудили задержки новых поставок. Иван упомянул, что им нужен план логистики на 3-й квартал к пятнице.",
    timestamp: "2026-02-17T10:30:00Z",
    customer_id: CUSTOMER_IDS.ivan,
    customer_name: "Иван Петров",
    metadata: { duration: 900, source: CallSource.MANUAL },
  },
  {
    id: MESSAGE_IDS.msg7,
    type: "message",
    title: "Сообщение от Елены Волковой",
    description: "Срочно! Нужно приостановить отгрузку размеров XS и XXL - они закончились у поставщика.",
    timestamp: "2026-02-17T08:45:00Z",
    customer_id: CUSTOMER_IDS.elena,
    customer_name: "Елена Волкова",
    metadata: { source: MessageSource.WHATSAPP, direction: MessageDirection.INCOMING },
  },
  {
    id: ALERT_IDS.alert3,
    type: "alert",
    title: "Упоминание срочной доставки",
    description: "Клиент упомянул \"срочную доставку\" 3 раза за последний звонок. Рекомендуется связаться.",
    timestamp: "2026-02-17T07:30:00Z",
    customer_id: CUSTOMER_IDS.ivan,
    customer_name: "Иван Петров",
    metadata: { severity: AlertSeverity.MEDIUM, type: AlertType.CUSTOM },
  },
  {
    id: ALERT_IDS.alert2,
    type: "alert",
    title: "Риск ухода клиента",
    description: "Сентимент снизился на 15% за последнюю неделю. Клиент упоминал конкурентов.",
    timestamp: "2026-02-16T11:30:00Z",
    customer_id: CUSTOMER_IDS.alexey,
    customer_name: "Алексей Козлов",
    metadata: { severity: AlertSeverity.CRITICAL, type: AlertType.POTENTIAL_LEAVE },
  },
  {
    id: CALL_IDS.call3,
    type: "call",
    title: "Вопросы по отгрузке",
    description: "Мария уточняла сроки и состав отгрузки на следующую неделю.",
    timestamp: "2026-02-16T15:30:00Z",
    customer_id: CUSTOMER_IDS.maria,
    customer_name: "Мария Сидорова",
    metadata: { duration: 600, source: CallSource.BITRIX },
  },
  {
    id: NOTE_IDS.note2,
    type: "note",
    title: "Заметка по инциденту TechCorp",
    description: "По инциденту с повреждением - виновник установлен (транспортная компания). Страховой случай подтверждён.",
    timestamp: "2026-02-15T16:00:00Z",
    customer_id: CUSTOMER_IDS.alexey,
    customer_name: "Алексей Козлов",
    metadata: { author: "Администратор" },
  },
  {
    id: CALL_IDS.call4,
    type: "call",
    title: "Разбор инцидента с повреждением",
    description: "Детальный разбор ситуации с повреждённой партией серверного оборудования.",
    timestamp: "2026-02-15T14:00:00Z",
    customer_id: CUSTOMER_IDS.alexey,
    customer_name: "Алексей Козлов",
    metadata: { duration: 2700, source: CallSource.MANUAL },
  },
  {
    id: ALERT_IDS.alert1,
    type: "alert",
    title: "Просрочка оплаты",
    description: "Счёт №1234 от 01.02.2026 не оплачен. Сумма: 125,000 руб. Просрочка: 14 дней.",
    timestamp: "2026-02-15T09:00:00Z",
    customer_id: CUSTOMER_IDS.ivan,
    customer_name: "Иван Петров",
    metadata: { severity: AlertSeverity.HIGH, type: AlertType.PAYMENT_OVERDUE },
  },
];

// ==========================================
// Helper Functions
// ==========================================

export function getCustomerById(id: string): Customer | undefined {
  return mockCustomers[id];
}

export function getCallsForCustomer(customerId: string): CallListItem[] {
  return mockCallsListItems.filter((call) => call.customer_id === customerId);
}

export function getAlertsForCustomer(customerId: string): Alert[] {
  return mockAlerts.filter((alert) => alert.customer_id === customerId);
}

export function getMessagesForCustomer(customerId: string): Message[] {
  return mockMessages.filter((msg) => msg.customer_id === customerId);
}

export function getNotesForCustomer(customerId: string): Note[] {
  return mockNotes.filter((note) => note.customer_id === customerId);
}

export function getActivitiesForCustomer(customerId: string): Activity[] {
  return mockActivities.filter((activity) => activity.customer_id === customerId);
}

export function getUnreadAlertsCount(): number {
  return mockAlerts.filter((alert) => !alert.is_read).length;
}

export function getUnresolvedAlertsCount(): number {
  return mockAlerts.filter((alert) => !alert.is_resolved).length;
}
