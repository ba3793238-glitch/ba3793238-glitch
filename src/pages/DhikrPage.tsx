import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Heart, ChevronLeft, RefreshCcw } from 'lucide-react';
import { MORNING_DHIKR, EVENING_DHIKR, AFTER_PRAYER_DHIKR, type DhikrItem } from '../data/azkar';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

export default function DhikrPage() {
  const { t, isRtl, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const categories = [
    { id: 'morning', name: t('morning'), icon: Sun, data: MORNING_DHIKR, color: 'text-amber-600 bg-amber-50' },
    { id: 'evening', name: t('evening'), icon: Moon, data: EVENING_DHIKR, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'after', name: language === 'ar' ? 'أذكار بعد الصلاة' : 'After Prayer Dhikr', icon: Heart, data: AFTER_PRAYER_DHIKR, color: 'text-rose-600 bg-rose-50' },
  ];

  const handleIncrement = (id: string, max: number) => {
    setCounts(prev => {
      const current = prev[id] || 0;
      if (current < max) {
        return { ...prev, [id]: current + 1 };
      }
      return prev;
    });
  };

  const resetCategory = () => {
    const category = categories.find(c => c.id === selectedCategory);
    if (category) {
        setCounts(prev => {
           const newCounts = { ...prev };
           category.data.forEach(item => newCounts[item.id] = 0);
           return newCounts;
        });
    }
  };

  if (selectedCategory) {
    const category = categories.find(c => c.id === selectedCategory)!;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
        <div className={cn("flex items-center justify-between", !isRtl && "flex-row-reverse")}>
           <button onClick={() => setSelectedCategory(null)} className={cn("flex items-center gap-2 text-primary font-medium", !isRtl && "flex-row-reverse")}>
             <ChevronLeft className={cn("w-5 h-5", isRtl ? "rotate-180" : "rotate-0")} />
             <span>{t('back')}</span>
           </button>
           <button onClick={resetCategory} className="p-2 text-primary/40 hover:text-primary transition-colors">
             <RefreshCcw size={20} />
           </button>
        </div>

        <div className="space-y-4">
          {category.data.map((item) => {
            const current = counts[item.id] || 0;
            const isFinished = current >= item.count;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleIncrement(item.id, item.count)}
                className={cn(
                  "w-full p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group",
                  isRtl ? "text-right" : "text-left",
                  isFinished 
                    ? "bg-primary/5 border-primary/20 opacity-80" 
                    : "bg-secondary border-primary/5 hover:border-primary/20 shadow-sm"
                )}
              >
                <div className="relative z-10 flex flex-col gap-4">
                   <p className={cn(
                       "arabic-text text-xl leading-relaxed text-primary-dark font-arabic",
                       !isRtl && "text-xl leading-relaxed"
                   )}>
                     {item.text}
                   </p>
                   <div className={cn("flex items-center justify-between", !isRtl && "flex-row-reverse")}>
                      <span className="text-[10px] text-primary/30 font-bold uppercase tracking-wider">{item.reference || ''}</span>
                      <div className={cn("flex items-center gap-4", !isRtl && "flex-row-reverse")}>
                         <div className="flex -space-x-1">
                            {Array.from({ length: item.count }).map((_, i) => (
                               <div key={i} className={cn(
                                 "w-1.5 h-1.5 rounded-full border border-secondary",
                                 i < current ? "bg-primary" : "bg-primary/10"
                               )} />
                            ))}
                         </div>
                         <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all",
                            isFinished ? "bg-primary text-white scale-90" : "bg-primary/5 text-primary"
                         )}>
                            {current}
                         </div>
                      </div>
                   </div>
                </div>
                {isFinished && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(cat.id)}
          className={cn(
            "flex items-center gap-6 p-8 bg-secondary rounded-[32px] shadow-sm border border-primary/5 hover:border-primary/20 hover:shadow-lg transition-all duration-500 group",
            isRtl ? "text-right" : "text-left flex-row-reverse"
          )}
        >
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110 shadow-sm", cat.color)}>
            <cat.icon size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl text-primary">{cat.name}</h3>
            <p className="text-primary-light/60 text-sm font-medium">
                {cat.data.length} {language === 'ar' ? 'أذكار حكيمة' : 'Wise Supplications'}
            </p>
          </div>
          <ChevronLeft className={cn(
              "text-primary/20 group-hover:text-primary transition-colors",
              !isRtl && "rotate-180"
          )} />
        </button>
      ))}
    </div>
  );
}

