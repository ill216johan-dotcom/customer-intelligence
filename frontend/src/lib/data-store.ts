"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  type CustomerListItem,
  type Customer,
  type CallListItem,
  type Message,
  type Note,
  type Alert,
  type Activity,
} from "./types";
import {
  mockCustomersListItems,
  mockCustomers,
  mockCallsListItems,
  mockMessages,
  mockNotes,
  mockAlerts,
  mockActivities,
} from "./mock-data";

// ==========================================
// Types for Data Store
// ==========================================

interface PersonalNote {
  id: string;
  content: string;
  customer_id: string | null;
  customer_name: string | null;
  is_private: boolean;
  alert_at: string | null;
  created_at: string;
  created_by: string;
}

interface DataStoreContextValue {
  // Customers
  customers: CustomerListItem[];
  customersMap: Record<string, Customer>;
  addCustomer: (customer: CustomerListItem) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;

  // Calls
  calls: CallListItem[];
  addCall: (call: CallListItem) => void;
  getCallsForCustomer: (customerId: string) => CallListItem[];

  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  getMessagesForCustomer: (customerId: string) => Message[];

  // Notes
  notes: Note[];
  addNote: (note: Note) => void;
  deleteNote: (noteId: string) => void;
  getNotesForCustomer: (customerId: string) => Note[];

  // Alerts
  alerts: Alert[];
  markAlertRead: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  getAlertsForCustomer: (customerId: string) => Alert[];

  // Activities (combined)
  activities: Activity[];
  addActivity: (activity: Activity) => void;

  // Personal Notes (for /notes page)
  personalNotes: PersonalNote[];
  addPersonalNote: (note: PersonalNote) => void;
  deletePersonalNote: (noteId: string) => void;
}

// ==========================================
// Context
// ==========================================

const DataStoreContext = createContext<DataStoreContextValue | null>(null);

// ==========================================
// Provider
// ==========================================

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  // Customers
  const [customers, setCustomers] = useState<CustomerListItem[]>(mockCustomersListItems);
  const [customersMap, setCustomersMap] = useState<Record<string, Customer>>(mockCustomers);

  // Calls
  const [calls, setCalls] = useState<CallListItem[]>(mockCallsListItems);

  // Messages
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  // Notes
  const [notes, setNotes] = useState<Note[]>(mockNotes);

  // Alerts
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  // Activities
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  // Personal Notes
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([
    {
      id: "pn-1",
      content: "Клиент интересуется новым тарифом. Перезвонить в среду.",
      customer_id: mockCustomersListItems[0]?.id || null,
      customer_name: mockCustomersListItems[0]?.name || null,
      is_private: false,
      alert_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      created_by: "Администратор",
    },
    {
      id: "pn-2",
      content: "Напомнить себе про квартальный отчёт. Подготовить данные по продажам.",
      customer_id: null,
      customer_name: null,
      is_private: true,
      alert_at: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      created_by: "Администратор",
    },
  ]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("customer-intel-data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.customersMap) setCustomersMap(parsed.customersMap);
        if (parsed.calls) setCalls(parsed.calls);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.alerts) setAlerts(parsed.alerts);
        if (parsed.activities) setActivities(parsed.activities);
        if (parsed.personalNotes) setPersonalNotes(parsed.personalNotes);
      } catch (e) {
        console.error("Failed to load data store:", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    const data = {
      customers,
      customersMap,
      calls,
      messages,
      notes,
      alerts,
      activities,
      personalNotes,
    };
    localStorage.setItem("customer-intel-data", JSON.stringify(data));
  }, [customers, customersMap, calls, messages, notes, alerts, activities, personalNotes]);

  // Customer operations
  const addCustomer = useCallback((customer: CustomerListItem) => {
    setCustomers((prev) => [customer, ...prev]);
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomersMap((prev) => ({
      ...prev,
      [id]: prev[id] ? { ...prev[id], ...updates, updated_at: new Date().toISOString() } : prev[id],
    }));
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    );
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setCustomersMap((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }, []);

  const getCustomer = useCallback((id: string) => {
    return customersMap[id];
  }, [customersMap]);

  // Call operations
  const addCall = useCallback((call: CallListItem) => {
    setCalls((prev) => [call, ...prev]);
    // Also add to activities
    const activity: Activity = {
      id: call.id,
      type: "call",
      title: call.title,
      description: `Звонок с ${call.customer_name || "клиентом"}`,
      timestamp: call.started_at,
      customer_id: call.customer_id,
      customer_name: call.customer_name,
      metadata: { duration: call.duration, source: call.source },
    };
    setActivities((prev) => [activity, ...prev]);
  }, []);

  const getCallsForCustomerCb = useCallback((customerId: string) => {
    return calls.filter((c) => c.customer_id === customerId);
  }, [calls]);

  // Message operations
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [message, ...prev]);
    // Also add to activities
    const activity: Activity = {
      id: message.id,
      type: "message",
      title: `Сообщение от ${message.sender_name}`,
      description: message.content.slice(0, 200),
      timestamp: message.sent_at,
      customer_id: message.customer_id,
      customer_name: message.customer_name || message.sender_name,
      metadata: { source: message.source, direction: message.direction },
    };
    setActivities((prev) => [activity, ...prev]);
  }, []);

  const getMessagesForCustomerCb = useCallback((customerId: string) => {
    return messages.filter((m) => m.customer_id === customerId);
  }, [messages]);

  // Note operations
  const addNote = useCallback((note: Note) => {
    setNotes((prev) => [note, ...prev]);
    // Also add to activities
    const activity: Activity = {
      id: note.id,
      type: "note",
      title: `Заметка: ${note.customer_name || "Системная"}`,
      description: note.content,
      timestamp: note.created_at,
      customer_id: note.customer_id,
      customer_name: note.customer_name,
      metadata: { author: note.author_name },
    };
    setActivities((prev) => [activity, ...prev]);
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setActivities((prev) => prev.filter((a) => a.id !== noteId));
  }, []);

  const getNotesForCustomerCb = useCallback((customerId: string) => {
    return notes.filter((n) => n.customer_id === customerId);
  }, [notes]);

  // Alert operations
  const markAlertRead = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, is_read: true, read_at: new Date().toISOString() }
          : a
      )
    );
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              is_read: true,
              is_resolved: true,
              resolved_at: new Date().toISOString(),
            }
          : a
      )
    );
  }, []);

  const getAlertsForCustomerCb = useCallback((customerId: string) => {
    return alerts.filter((a) => a.customer_id === customerId);
  }, [alerts]);

  // Activity operations
  const addActivity = useCallback((activity: Activity) => {
    setActivities((prev) => [activity, ...prev]);
  }, []);

  // Personal Note operations
  const addPersonalNote = useCallback((note: PersonalNote) => {
    setPersonalNotes((prev) => [note, ...prev]);
  }, []);

  const deletePersonalNote = useCallback((noteId: string) => {
    setPersonalNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  const value: DataStoreContextValue = {
    customers,
    customersMap,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,

    calls,
    addCall,
    getCallsForCustomer: getCallsForCustomerCb,

    messages,
    addMessage,
    getMessagesForCustomer: getMessagesForCustomerCb,

    notes,
    addNote,
    deleteNote,
    getNotesForCustomer: getNotesForCustomerCb,

    alerts,
    markAlertRead,
    resolveAlert,
    getAlertsForCustomer: getAlertsForCustomerCb,

    activities,
    addActivity,

    personalNotes,
    addPersonalNote,
    deletePersonalNote,
  };

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

// ==========================================
// Hook
// ==========================================

export function useDataStore() {
  const context = useContext(DataStoreContext);
  if (!context) {
    throw new Error("useDataStore must be used within DataStoreProvider");
  }
  return context;
}

// Export type for use in components
export type { DataStoreContextValue, PersonalNote };
