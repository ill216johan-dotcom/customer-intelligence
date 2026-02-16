import { Search, Mic, Plus, Sparkles, MessageSquare, Phone, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans">
      
      {/* Header Section */}
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
          <button className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-all active:scale-95 font-medium border border-border">
            <Mic className="w-5 h-5" />
            <span>Загрузить звонок</span>
          </button>
        </div>
      </div>

      {/* Search Bar (NotebookLM Style) */}
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

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Recent Activity / Sources */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"/>
              Последние активности
            </h2>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Все источники
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
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
              <h3 className="font-semibold text-lg mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">Еженедельный синк с Иваном</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                Обсудили задержки новых поставок. Иван упомянул, что им нужен план логистики на 3-й квартал к пятнице. Договорились обсудить модель ценообразования...
              </p>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>Сегодня, 10:30</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>15 мин</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group p-5 rounded-2xl border border-border bg-card hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden">
               <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">Telegram</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">Тикет поддержки #492</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                Клиент спрашивает о статусе возврата заказа #12345. Команда поддержки отправила трек-номер, но клиент утверждает, что он не работает...
              </p>
               <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>Вчера</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>12 сообщений</span>
              </div>
            </div>
            
             {/* Card 3 */}
            <div className="group p-5 rounded-2xl border border-border bg-card hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all cursor-pointer relative overflow-hidden">
               <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100 px-2 py-1 rounded-full">CRM</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">Новый лид: TechCorp</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                Добавлены контактные данные и первичные требования к контракту фулфилмента. Потенциальный объем: 500 заказов/мес.
              </p>
               <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>2 дня назад</span>
              </div>
            </div>
            
             {/* Card 4 - Add New */}
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

        {/* Sidebar / Insights */}
        <div className="space-y-8">
           <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full"/>
            Рекомендованные действия
          </h2>
          
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shrink-0 group-hover:scale-125 transition-transform" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Написать Ивану</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">Он упомянул "срочную доставку" 3 раза за последний звонок. Дедлайн близко.</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0 group-hover:scale-125 transition-transform" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Риск оттока: TechCorp</p>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">Сентимент упал на 15% за последнюю неделю. Проверьте тикеты поддержки.</p>
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
