import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Compass, Moon, Sun, Calculator, Quote, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNextPrayer } from '../services/prayerService';
import { getDailyHadith, type Hadith } from '../services/hadithService';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function HomePage() {
  const { t, isRtl, language } = useLanguage();
  const [nextPrayer, setNextPrayer] = useState<any>(null);
  const [dailyHadith, setDailyHadith] = useState<Hadith | null>(null);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [location, setLocation] = useState({ lat: 30.0444, lng: 31.2357 }); // Cairo default

  const streak = useMemo(() => {
    const saved = localStorage.getItem('prayerLog');
    if (!saved) return 0;
    const prayerLog = JSON.parse(saved);
    
    let streakCount = 0;
    let tempDate = new Date();
    tempDate.setHours(0, 0, 0, 0);
    const todayStr = tempDate.toISOString().split('T')[0];

    while (true) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const dayPrayers = prayerLog[dateStr] || [];
      const mainPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      const completedMain = mainPrayers.every(p => dayPrayers.includes(p));

      if (completedMain) {
        streakCount++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        if (dateStr === todayStr) {
            tempDate.setDate(tempDate.getDate() - 1);
            continue;
        }
        break;
      }
    }
    return streakCount;
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('calcSettings');
    const calcSettings = saved ? JSON.parse(saved) : undefined;
    setNextPrayer(getNextPrayer(location.lat, location.lng, calcSettings));
    const interval = setInterval(() => {
       setNextPrayer(getNextPrayer(location.lat, location.lng, calcSettings));
    }, 60000);
    return () => clearInterval(interval);
  }, [location]);

  useEffect(() => {
    getDailyHadith(language).then((data) => {
      setDailyHadith(data);
    });
  }, [language]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Welcome Card */}
      <section className="relative overflow-hidden rounded-3xl bg-primary text-white p-8 shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-white/70">
            <Moon className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-medium">{isRtl ? 'رمضان كريم' : 'Ramadan Kareem'}</span>
          </div>
          <h2 className="text-3xl font-display font-bold leading-tight italic text-justify no-underline">
            {isRtl ? (
              <>حياتك أفضل <br />مع القران الكريم</>
            ) : (
              <>Your life is better <br />with the Holy Quran</>
            )}
          </h2>
          <p className="text-white/60 text-sm max-w-[200px]">
             {isRtl ? 'ابدأ يومك بآية من الذكر الحكيم وتتبع صلواتك.' : 'Start your day with a verse from the Holy Remembrance and track your prayers.'}
          </p>
        </div>
        {/* Abstract Pattern background */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-50" />
      </section>

      {/* Next Prayer & Streak Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nextPrayer && (
          <div className="bg-secondary rounded-3xl p-6 shadow-sm border border-primary/5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-primary/40 text-xs font-semibold uppercase tracking-wider">{t('remaining')}</span>
              <h3 className="text-2xl font-bold text-primary">{nextPrayer.name}</h3>
              <p className="text-primary-light text-sm font-medium">{nextPrayer.time}</p>
            </div>
            <div className="flex flex-col items-center">
               <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Compass className="w-8 h-8 animate-spin-slow" />
               </div>
            </div>
          </div>
        )}

        <Link to="/prayer" className="bg-primary rounded-3xl p-6 shadow-lg shadow-primary/20 flex items-center justify-between text-white overflow-hidden relative group">
           <Flame className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
           <div className="relative z-10 space-y-1">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">{t('streak')}</span>
              <h3 className="text-2xl font-black">{streak} {t('consecutive_days')}</h3>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{t('mark_completed')}</p>
           </div>
           <div className="relative z-10 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white">
               <Flame className={cn("w-8 h-8", streak > 0 ? "text-accent fill-accent" : "text-white/40")} />
           </div>
        </Link>
      </section>

      {/* Daily Hadith Quick View */}
      {dailyHadith && (
        <section 
          className="bg-secondary rounded-3xl p-6 shadow-sm border border-primary/5 cursor-pointer group hover:border-primary/20 transition-all"
          onClick={() => setSelectedHadith(dailyHadith)}
        >
          <div className="flex items-center gap-2 mb-4">
             <Quote className="w-5 h-5 text-accent" />
             <span className="text-xs font-bold uppercase tracking-widest text-primary/40">{t('hadith_of_day')}</span>
          </div>
          <p className={cn(
            "text-lg leading-relaxed font-arabic text-primary line-clamp-3",
            isRtl ? "text-right" : "text-left"
          )}>
            {dailyHadith.text}
          </p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-primary/30 uppercase font-bold tracking-widest">{dailyHadith.reference}</span>
            <span className="text-sm font-bold text-accent group-hover:underline">
              {t('read_more')}
            </span>
          </div>
        </section>
      )}

      {/* Explanation Modal */}
      {selectedHadith && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedHadith(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-primary">{t('hadith')} #{selectedHadith.number}</h3>
                <button 
                  onClick={() => setSelectedHadith(null)}
                  className="p-2 hover:bg-secondary rounded-full"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-2">{t('hadith')}</h4>
                  <p className={cn(
                    "text-xl leading-relaxed text-primary font-arabic",
                    isRtl ? "text-right" : "text-left"
                  )}>
                    {selectedHadith.text}
                  </p>
                </div>

                {language === 'en' && selectedHadith.translation && (
                  <div>
                    <h4 className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-2">{t('translation')}</h4>
                    <p className="text-primary/70 italic leading-relaxed">
                      {selectedHadith.translation}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-2">{t('explanation')}</h4>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-primary/80 leading-relaxed text-center font-medium">
                      {selectedHadith.explanation || (language === 'ar' 
                        ? "شرح هذا الحديث يتطلب الرجوع للمصادر الفقهية المعتمدة. يعلمنا هذا الحديث قيماً أخلاقية سامية..."
                        : "The explanation of this hadith requires referring to approved jurisprudential sources. It teaches us high moral values...")}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-secondary">
                  <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">{t('reference')}</span>
                  <p className="text-sm font-bold text-primary mt-1">{selectedHadith.reference}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-secondary flex justify-center">
              <button 
                onClick={() => setSelectedHadith(null)}
                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all"
              >
                {t('back')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-2 gap-4">
        {[
          { label: t('tasbih'), icon: Calculator, color: 'bg-emerald-100 text-emerald-700', path: '/tasbih' },
          { label: t('prayer'), icon: Compass, color: 'bg-amber-100 text-amber-700', path: '/prayer' },
          { label: t('morning'), icon: Sun, color: 'bg-blue-100 text-blue-700', path: '/dhikr' },
          { label: t('evening'), icon: Moon, color: 'bg-indigo-100 text-indigo-700', path: '/dhikr' },
        ].map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            className="group flex flex-col items-center gap-3 p-6 bg-secondary rounded-3xl shadow-sm border border-transparent hover:border-primary/20 hover:shadow-md transition-all"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
              <item.icon size={24} />
            </div>
            <span className="font-semibold text-primary/80">{item.label}</span>
          </Link>
        ))}
      </section>
    </motion.div>
  );
}

