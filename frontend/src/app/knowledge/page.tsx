"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Clock, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ==========================================
// Types
// ==========================================

interface SearchResult {
  id: string;
  type: "call" | "message" | "note" | "customer";
  title: string;
  content: string;
  source: string;
  customer_name?: string;
  relevance: number;
  timestamp: string;
}

// ==========================================
// Knowledge Base Page
// ==========================================

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "проблемы с поставками",
    "тарифы 2024",
    "WildBerry интеграция",
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Simulated search
  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock results
    const mockResults: SearchResult[] = [
      {
        id: "1",
        type: "call",
        title: "Еженедельный созвон с ООО «Вектор»",
        content: "Клиент выразил недовольство задержками поставок. Обсудили новые сроки. По итогам — поставки возобновляются с 15 числа.",
        source: "Звонок от 12.02.2025",
        customer_name: "ООО «Вектор»",
        relevance: 0.95,
        timestamp: "2025-02-12T10:30:00",
      },
      {
        id: "2",
        type: "note",
        title: "Заметка: ООО «Вектор»",
        content: "Клиент требует скидку 10% на следующий квартал из-за задержек. Предложить компенсацию доп. услугами.",
        source: "Заметка от 10.02.2025",
        customer_name: "ООО «Вектор»",
        relevance: 0.87,
        timestamp: "2025-02-10T14:20:00",
      },
      {
        id: "3",
        type: "message",
        title: "Переписка в Telegram",
        content: "Клиент: Когда будет следующая поставка? Менеджер: По плану 15-го числа, всё в силе.",
        source: "Telegram от 11.02.2025",
        customer_name: "ООО «Вектор»",
        relevance: 0.72,
        timestamp: "2025-02-11T16:45:00",
      },
    ];

    setResults(mockResults);
    setIsSearching(false);

    // Add to recent searches
    if (!recentSearches.includes(query.trim())) {
      setRecentSearches((prev) => [query.trim(), ...prev].slice(0, 5));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "call":
        return "bg-blue-50/80 text-blue-700 border-blue-100";
      case "message":
        return "bg-emerald-50/80 text-emerald-700 border-emerald-100";
      case "note":
        return "bg-stone-100/80 text-stone-700 border-stone-200";
      case "customer":
        return "bg-amber-50/80 text-amber-700 border-amber-100";
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "call":
        return "Звонок";
      case "message":
        return "Сообщение";
      case "note":
        return "Заметка";
      case "customer":
        return "Клиент";
    }
  };

  return (
    <div className="px-6 py-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">База знаний</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-поиск по всем данным клиентов: звонки, сообщения, заметки
        </p>
      </div>

      {/* Search Box */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Задайте вопрос или введите ключевые слова..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring/50 placeholder:text-muted-foreground resize-none"
            rows={2}
          />
          <div className="absolute right-3 bottom-3">
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              size="sm"
              className="gap-2"
            >
              {isSearching ? (
                <>Поиск...</>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Найти
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Нажмите Enter для поиска. AI найдёт релевантную информацию по всем клиентам.
        </p>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              Результаты поиска: {results.length}
            </h2>
            <button
              onClick={() => {
                setResults([]);
                setQuery("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Очистить
            </button>
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                      {result.customer_name && (
                        <span className="text-xs text-muted-foreground">
                          {result.customer_name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold mb-1">{result.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{result.source}</p>
                  </div>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    {Math.round(result.relevance * 100)}%
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{result.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches (when no results) */}
      {results.length === 0 && (
        <div>
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Быстрые запросы
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                "Проблемные клиенты",
                "Скоро истекают контракты",
                "Жалобы за неделю",
                "Потенциальные сделки",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-secondary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                <Clock className="w-3 h-3 inline mr-1" />
                Недавние поиск
              </h2>
              <div className="space-y-1">
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(search)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {recentSearches.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Начните поиск</h3>
              <p className="text-xs text-muted-foreground">
                Введите вопрос или ключевые слова для поиска по базе знаний
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
