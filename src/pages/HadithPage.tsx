import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Search, Info, Quote, Download, CheckCircle2, RotateCcw } from 'lucide-react';
import { getDailyHadith, getAllHadiths, saveHadithsForOffline, isOfflineAvailable, type Hadith } from '../services/hadithService';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function HadithPage() {
  const { t, isRtl, language } = useLanguage();
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [dailyHadith, setDailyHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [isOffline, setIsOffline] = useState(isOfflineAvailable());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [daily, all] = await Promise.all([
        getDailyHadith(language),
        getAllHadiths(language)
      ]);
      setDailyHadith(daily);
      setHadiths(all);
      setLoading(false);
    }
    loadData();
  }, [language]);

  const handleDownloadOffline = async () => {
    setSyncing(true);
    const success = await saveHadithsForOffline();
    if (success) {
      setIsOffline(true);
    }
    setSyncing(false);
  };

  const filteredHadiths = hadiths.filter(h => 
    h.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.translation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-primary mb-2">{t('hadith')}</h1>
        <p className="text-primary/60 mb-6">{t('index')}</p>
        
        <div className="flex justify-center">
            <button
                onClick={handleDownloadOffline}
                disabled={syncing}
                className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm",
                    isOffline 
                        ? "bg-secondary text-primary/60 border border-primary/10" 
                        : "bg-primary text-white hover:bg-primary/90"
                )}
            >
                {syncing ? (
                    <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        {t('downloading')}
                    </>
                ) : isOffline ? (
                    <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {t('offline_ready')}
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        {t('download_offline')}
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Daily Hadith Card */}
      {dailyHadith && !searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setSelectedHadith(dailyHadith)}
          className="bg-primary text-white p-6 rounded-3xl mb-8 shadow-xl relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Quote className="w-5 h-5 text-white/60" />
              <span className="text-sm font-bold uppercase tracking-widest text-white/80">{t('hadith_of_day')}</span>
            </div>
            <p className={cn(
              "text-xl leading-relaxed mb-6 font-arabic",
              isRtl ? "text-right" : "text-left"
            )}>
              {dailyHadith.text}
            </p>
            {language === 'en' && dailyHadith.translation && (
              <p className="text-white/80 italic mb-6 border-l-2 border-white/20 pl-4">
                {dailyHadith.translation}
              </p>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-white/60">{dailyHadith.reference}</span>
              <div 
                className="flex items-center gap-2 px-4 py-2 bg-secondary/10 group-hover:bg-secondary/20 rounded-xl text-sm font-bold transition-colors"
              >
                <Info className="w-4 h-4" />
                {t('explanation')}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
        <input
          type="text"
          placeholder={t('search_surah')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-secondary/50 border-none rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 text-primary font-bold transition-all"
        />
      </div>

      {/* Hadith List */}
      <div className="grid gap-4">
        {filteredHadiths.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedHadith(h)}
            className="bg-secondary/30 p-6 rounded-2xl hover:bg-secondary/50 cursor-pointer transition-all border border-transparent hover:border-primary/10 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                {h.number}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "line-clamp-3 text-lg leading-relaxed mb-2 font-arabic text-primary",
                  isRtl ? "text-right" : "text-left"
                )}>
                  {h.text}
                </p>
                {language === 'en' && h.translation && (
                  <p className="text-primary/60 line-clamp-2 text-sm italic">
                    {h.translation}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
                    <p className="text-primary/80 leading-relaxed">
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
    </div>
  );
}
