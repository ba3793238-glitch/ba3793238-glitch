import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, MapPin, Compass, BellOff, CheckCircle2, Trophy, Flame, Calendar, ChevronRight } from 'lucide-react';
import { getPrayerTimes, type PrayerTimeInfo } from '../services/prayerService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface DayLog {
  [date: string]: string[]; // date -> list of prayer ids completed
}

export default function PrayerPage() {
  const { t, isRtl, language } = useLanguage();
  const [times, setTimes] = useState<PrayerTimeInfo[]>([]);
  const [location, setLocation] = useState({ 
    lat: 30.0444, 
    lng: 31.2357, 
    name: language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt' 
  });
  const [reminders, setReminders] = useState<string[]>([]); // Enabled prayer IDs
  const [prayerLog, setPrayerLog] = useState<DayLog>(() => {
    const saved = localStorage.getItem('prayerLog');
    return saved ? JSON.parse(saved) : {};
  });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    localStorage.setItem('prayerLog', JSON.stringify(prayerLog));
  }, [prayerLog]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation(prev => ({ 
          ...prev, 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude,
          name: language === 'ar' ? 'موقعك الحالي' : 'Current Location'
        }));
      }, () => {
        // Fallback or handle error
      });
    }
  }, [language]);

  useEffect(() => {
    const saved = localStorage.getItem('calcSettings');
    const calcSettings = saved ? JSON.parse(saved) : undefined;
    const items = getPrayerTimes(location.lat, location.lng, new Date(), calcSettings);
    
    // Map internal prayer IDs to translated names if needed
    const translatedItems = items.map(p => ({
        ...p,
        name: t(p.id as any) || p.name
    }));
    
    setTimes(translatedItems);
  }, [location, t]);

  const toggleReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReminders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleComplete = (id: string) => {
    setPrayerLog(prev => {
      const today = prev[todayStr] || [];
      const updated = today.includes(id) 
        ? today.filter(i => i !== id)
        : [...today, id];
      return { ...prev, [todayStr]: updated };
    });
  };

  const stats = useMemo(() => {
    // Calculate Streak
    let streak = 0;
    let tempDate = new Date();
    // Move to start of today
    tempDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const dayPrayers = prayerLog[dateStr] || [];
      // Assuming 5 main prayers: fajr, dhuhr, asr, maghrib, isha
      const mainPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      const completedMain = mainPrayers.every(p => dayPrayers.includes(p));

      if (completedMain) {
        streak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        // If it's today and not finished, don't break streak yet if yesterday is full
        if (dateStr === todayStr) {
            tempDate.setDate(tempDate.getDate() - 1);
            continue;
        }
        break;
      }
    }

    // Total this week
    let weeklyTotal = 0;
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    });
    
    last7Days.forEach(date => {
        weeklyTotal += (prayerLog[date] || []).length;
    });

    return { streak, weeklyTotal };
  }, [prayerLog, todayStr]);

  const completedToday = prayerLog[todayStr] || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12"
    >
      {/* Stats Header */}
      <section className="grid grid-cols-2 gap-4">
        <motion.div 
            whileHover={{ y: -2 }}
            className="bg-primary text-white p-5 rounded-[32px] shadow-lg shadow-primary/20 relative overflow-hidden"
        >
            <Flame className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t('streak')}</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{stats.streak}</span>
                    <span className="text-xs font-bold text-white/60">{t('consecutive_days')}</span>
                </div>
            </div>
        </motion.div>

        <motion.div 
            whileHover={{ y: -2 }}
            className="bg-secondary p-5 rounded-[32px] shadow-sm border border-primary/5 relative overflow-hidden"
        >
            <Calendar className="absolute -right-4 -bottom-4 w-24 h-24 text-primary/5 rotate-12" />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-primary/40" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">{t('weekly_progress')}</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-primary">{stats.weeklyTotal}</span>
                    <span className="text-xs font-bold text-primary/40">{t('total_prayers')}</span>
                </div>
            </div>
        </motion.div>
      </section>

      <header className={cn(
        "flex items-center justify-between p-4 px-6 bg-secondary rounded-[32px] shadow-sm border border-primary/5",
        !isRtl && "flex-row-reverse text-left"
      )}>
        <div className={cn("flex items-center gap-3", !isRtl && "flex-row-reverse text-left")}>
          <div className="p-2 bg-primary/10 rounded-2xl">
             <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div dir={isRtl ? 'rtl' : 'ltr'}>
            <h2 className="font-bold text-primary text-sm md:text-base">{location.name}</h2>
            <p className="text-[9px] text-primary/40 font-bold uppercase tracking-widest">
                {isRtl ? 'الموقع الجغرافي الحالى' : 'Current Geographic Location'}
            </p>
          </div>
        </div>
        <button className="p-3 bg-accent/10 rounded-full text-accent hover:bg-accent/20 transition-all hover:rotate-45">
          <Compass className="w-5 h-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {times.map((item) => {
          const isNotificationEnabled = reminders.includes(item.id);
          const isCompleted = completedToday.includes(item.id);

          return (
            <motion.div
              layout
              key={item.id}
              onClick={() => toggleComplete(item.id)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center justify-between p-5 bg-secondary rounded-[32px] shadow-sm border transition-all duration-500 cursor-pointer group",
                isCompleted ? "border-primary/20 bg-primary/[0.02]" : "border-transparent hover:border-primary/5",
                !isRtl && "flex-row-reverse"
              )}
            >
              <div className={cn("flex items-center gap-5", !isRtl && "flex-row-reverse text-left")}>
                <div className="relative">
                    <motion.div
                        animate={isCompleted ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                        className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                            isCompleted ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-primary/5 text-primary/20 group-hover:bg-primary/10"
                        )}
                    >
                        <CheckCircle2 size={24} className={cn("transition-all", isCompleted ? "opacity-100 scale-100" : "opacity-40 scale-75")} />
                    </motion.div>
                </div>

                <div className="space-y-0.5" dir={isRtl ? 'rtl' : 'ltr'}>
                  <h3 className={cn(
                    "font-bold text-lg transition-colors",
                    isCompleted ? "text-primary" : "text-primary/60"
                  )}>{item.name}</h3>
                  <p className="text-primary-light/40 font-bold text-xs uppercase tracking-widest">{item.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => toggleReminder(item.id, e)}
                  className={cn(
                    "p-2.5 rounded-xl transition-all duration-300",
                    isNotificationEnabled ? "bg-accent/10 text-accent" : "bg-primary/5 text-primary/20 hover:text-primary/40"
                  )}
                >
                  {isNotificationEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                </button>
                <ChevronRight className={cn(
                    "w-4 h-4 text-primary/10 transition-transform",
                    isRtl ? "rotate-180" : ""
                )} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-8 bg-primary/95 text-white rounded-[40px] shadow-2xl relative overflow-hidden group">
         <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">{t('reminders')}</span>
            <h4 className="text-xl font-display leading-relaxed italic opacity-90">
              "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا"
            </h4>
            <div className="w-12 h-1 px-1 bg-accent rounded-full mt-2" />
         </div>
         {/* Decorative circle */}
         <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-1000" />
      </div>
    </motion.div>
  );
}


