import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, ChevronRight, Search, Play, Pause, Square, SkipBack, SkipForward, Headphones, Download, CheckCircle2, RotateCcw } from 'lucide-react';
import { fetchSurahs, fetchSurahDetail, fetchSurahWithTranslation, fetchSurahAudio, fetchReciters, downloadSurahOffline, isSurahOffline, type Surah, type Ayah } from '../services/quranService';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { Languages } from 'lucide-react';

export default function QuranPage() {
  const { t, isRtl, language } = useLanguage();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [reciters, setReciters] = useState<{ id: string; name: string; englishName: string }[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [surahContent, setSurahContent] = useState<{ ayahs: Ayah[]; translation?: Ayah[]; surah: Surah } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState(32);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedEdition, setSelectedEdition] = useState<string>(() => {
      return localStorage.getItem('quranEdition') || (language === 'ar' ? 'none' : 'en.sahih');
  });
  const [selectedReciter, setSelectedReciter] = useState<string>(() => {
    return localStorage.getItem('quranReciter') || 'ar.alafasy';
  });
  const [audioAyahs, setAudioAyahs] = useState<Ayah[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [audio] = useState(new Audio());
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (selectedSurah) {
        setIsOffline(isSurahOffline(selectedSurah, selectedEdition));
    }
  }, [selectedSurah, selectedEdition]);

  useEffect(() => {
    if (currentAudioIndex !== -1 && audioAyahs[currentAudioIndex]) {
      const activeAyah = audioAyahs[currentAudioIndex];
      // Small delay to ensure DOM is updated and page transitions are finished
      const timer = setTimeout(() => {
        const element = document.getElementById(`ayah-${activeAyah.number}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentAudioIndex, audioAyahs]);

  const editions = [
    { id: 'none', label: t('none') },
    { id: 'en.sahih', label: 'English (Sahih International)' },
    { id: 'en.ahmedali', label: 'English (Ahmed Ali)' },
    { id: 'fr.hamidullah', label: 'French (Hamidullah)' },
    { id: 'ur.ahmedali', label: 'Urdu (Ahmed Ali)' },
    { id: 'tr.diyanet', label: 'Turkish (Diyanet)' },
  ];

  useEffect(() => {
    fetchSurahs().then((data) => {
      setSurahs(data);
      setLoading(false);
    });

    fetchReciters().then(setReciters);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audio]);

  useEffect(() => {
    const handleEnded = () => {
      setCurrentAudioIndex(prev => {
        if (prev < audioAyahs.length - 1) {
          return prev + 1;
        }
        setIsPlaying(false);
        return -1;
      });
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [audio, audioAyahs]);

  useEffect(() => {
    if (currentAudioIndex >= 0 && currentAudioIndex < audioAyahs.length) {
      const ayah = audioAyahs[currentAudioIndex];
      if (ayah.audio) {
        audio.src = ayah.audio;
        audio.play();
        setIsPlaying(true);

        // Auto scroll/page to the ayah
        const pageOfAyah = ayah.page;
        if (surahContent) {
           const pages = getPages(surahContent.ayahs);
           const pageIndex = pages.findIndex(p => p.some(a => a.number === ayah.number));
           if (pageIndex !== -1 && pageIndex !== currentPageIndex) {
              setCurrentPageIndex(pageIndex);
           }
        }
      }
    }
  }, [currentAudioIndex, audioAyahs, audio]);

  const getPages = (ayahs: Ayah[]) => {
    const groups: Record<number, Ayah[]> = {};
    ayahs.forEach(ayah => {
      if (!groups[ayah.page]) groups[ayah.page] = [];
      groups[ayah.page].push(ayah);
    });
    return Object.values(groups);
  };

  const handleSurahClick = async (num: number, edition = selectedEdition) => {
    setLoading(true);
    setSelectedSurah(num);
    setIsPlaying(false);
    setCurrentAudioIndex(-1);
    audio.pause();
    
    if (edition === 'none') {
        const detail = await fetchSurahDetail(num);
        setSurahContent(detail);
    } else {
        const detail = await fetchSurahWithTranslation(num, edition);
        setSurahContent(detail);
    }
    
    // Pre-fetch audio ayahs
    // Don't fail if audiofetch fails (offline)
    try {
        const audioData = await fetchSurahAudio(num, selectedReciter);
        setAudioAyahs(audioData);
    } catch (e) {
        setAudioAyahs([]);
    }

    setCurrentPageIndex(0);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async () => {
    if (!selectedSurah) return;
    setSyncing(true);
    const success = await downloadSurahOffline(selectedSurah, selectedEdition);
    if (success) {
        setIsOffline(true);
    }
    setSyncing(false);
  };

  const handleEditionChange = async (edition: string) => {
      setSelectedEdition(edition);
      localStorage.setItem('quranEdition', edition);
      if (selectedSurah) {
          await handleSurahClick(selectedSurah, edition);
      }
  };

  const handleReciterChange = async (reciter: string) => {
      setSelectedReciter(reciter);
      localStorage.setItem('quranReciter', reciter);
      if (selectedSurah) {
          const audioData = await fetchSurahAudio(selectedSurah, reciter);
          setAudioAyahs(audioData);
          if (isPlaying) {
              const currentAyah = audioAyahs[currentAudioIndex];
              const newIndex = audioData.findIndex(a => a.number === currentAyah?.number);
              setCurrentAudioIndex(newIndex);
          }
      }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentAudioIndex === -1) {
        setCurrentAudioIndex(0);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    }
  };

  const stopAudio = () => {
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentAudioIndex(-1);
  };

  const filteredSurahs = surahs.filter(s => 
    s.name.includes(searchQuery) || 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString() === searchQuery
  );

  // Group ayahs by page
  const pages = React.useMemo(() => {
    if (!surahContent) return [];
    const groups: Record<number, Ayah[]> = {};
    surahContent.ayahs.forEach(ayah => {
      if (!groups[ayah.page]) groups[ayah.page] = [];
      groups[ayah.page].push(ayah);
    });
    return Object.values(groups);
  }, [surahContent]);

  const currentPage = pages[currentPageIndex] || [];
  
  // Find corresponding translation for current page
  const currentTranslationPage = React.useMemo(() => {
      if (!surahContent?.translation) return [];
      const groups: Record<number, Ayah[]> = {};
      surahContent.translation.forEach(ayah => {
          if (!groups[ayah.page]) groups[ayah.page] = [];
          groups[ayah.page].push(ayah);
      });
      const translationPages = Object.values(groups);
      return translationPages[currentPageIndex] || [];
  }, [surahContent, currentPageIndex]);

  if (selectedSurah && surahContent) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="space-y-6 pb-24"
      >
        <div className={cn("flex items-center justify-between px-2 gap-4", !isRtl && "flex-row-reverse")}>
          <button 
            onClick={() => setSelectedSurah(null)}
            className="flex items-center gap-2 text-primary/60 hover:text-primary font-bold text-sm bg-secondary/50 p-2 px-4 rounded-2xl border border-primary/5 transition-all"
          >
            <ChevronRight className={cn("w-4 h-4", isRtl ? "rotate-180" : "rotate-0")} />
            <span>{t('index')}</span>
          </button>
          
          <div className="flex gap-2 items-center overflow-x-auto no-scrollbar max-w-[200px] md:max-w-md">
             <div className="p-2 bg-secondary/50 rounded-xl border border-primary/5 flex items-center gap-2 shrink-0">
                <Languages className="w-4 h-4 text-primary/40" />
                <select 
                    value={selectedEdition}
                    onChange={(e) => handleEditionChange(e.target.value)}
                    className="bg-transparent text-[10px] font-bold text-primary outline-none border-none max-w-[60px] md:max-w-[120px]"
                >
                    {editions.map(e => (
                        <option key={e.id} value={e.id}>{e.label}</option>
                    ))}
                </select>
             </div>

             <div className="p-2 bg-secondary/50 rounded-xl border border-primary/5 flex items-center gap-2 shrink-0">
                <Headphones className="w-4 h-4 text-primary/40" />
                <select 
                    value={selectedReciter}
                    onChange={(e) => handleReciterChange(e.target.value)}
                    className="bg-transparent text-[10px] font-bold text-primary outline-none border-none max-w-[60px] md:max-w-[120px]"
                >
                    {reciters.map(r => (
                        <option key={r.id} value={r.id}>{language === 'ar' ? r.name : r.englishName}</option>
                    ))}
                </select>
             </div>

             <div className="p-2 bg-secondary/50 rounded-xl border border-primary/5 flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-bold text-primary/40 uppercase">{t('font_size')}</span>
                <input 
                  type="range" 
                  min="16" 
                  max="60" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-12 accent-primary" 
                />
             </div>

             <button
                onClick={handleDownload}
                disabled={syncing}
                className={cn(
                    "p-2 rounded-xl border transition-all flex items-center justify-center shrink-0",
                    isOffline 
                        ? "bg-green-500/10 border-green-500/20 text-green-600" 
                        : "bg-secondary/50 border-primary/5 text-primary/40 hover:text-primary hover:bg-secondary"
                )}
              >
                {syncing ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                ) : isOffline ? (
                    <CheckCircle2 className="w-4 h-4" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
              </button>
          </div>
        </div>

        {/* Book Container */}
        <div className="mus-haf-page mus-haf-shadow rounded-[2rem] border-4 border-accent/20 p-6 md:p-10 min-h-[70vh] relative flex flex-col">
          {/* Decorative Corner Elements */}
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-accent/30 rounded-tr-xl" />
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-accent/30 rounded-tl-xl" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-accent/30 rounded-br-xl" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-accent/30 rounded-bl-xl" />

          {/* Page Header */}
          <div className="text-center mb-10 space-y-4">
             {currentPageIndex === 0 && (
               <div className="inline-block p-4 px-10 border-2 border-accent/40 rounded-full bg-secondary/30 backdrop-blur-sm shadow-inner">
                  <h2 className="text-4xl font-display font-bold text-primary arabic-text">
                    {language === 'ar' ? surahContent.surah.name : surahContent.surah.englishName}
                  </h2>
               </div>
             )}
             {currentPageIndex === 0 && surahContent.surah.number !== 1 && surahContent.surah.number !== 9 && (
               <p className="arabic-text text-3xl text-primary/70 pt-4">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
             )}
          </div>

          {/* Verses Flow */}
          {selectedEdition !== 'none' ? (
                <div className="flex-1 space-y-8" style={{ fontSize: `${fontSize}px` }}>
                    {currentPage.map((ayah, idx) => {
                        let text = ayah.text;
                        if (surahContent.surah.number !== 1 && ayah.numberInSurah === 1) {
                            text = text.replace('بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', '').trim();
                        }
                        
                        const translation = currentTranslationPage[idx];
                        const isBeingPlayed = audioAyahs[currentAudioIndex]?.number === ayah.number;

                        return (
                            <div 
                                key={ayah.number} 
                                id={`ayah-${ayah.number}`}
                                className={cn(
                                    "flex flex-col gap-3 pb-6 border-b border-accent/5 last:border-none transition-all duration-500",
                                    isBeingPlayed && "bg-primary/5 -mx-4 px-4 py-4 rounded-3xl shadow-sm border border-primary/10"
                                )}
                            >
                                <div className="flex items-start gap-4 justify-end">
                                    <span className={cn(
                                        "arabic-text leading-loose tracking-wide transition-colors duration-500",
                                        isBeingPlayed ? "text-primary font-bold" : "text-primary-dark"
                                    )}>
                                        {text}
                                    </span>
                                    <motion.div 
                                        animate={isBeingPlayed ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                                        transition={{ repeat: isBeingPlayed ? Infinity : 0, duration: 2 }}
                                        className={cn(
                                            "verse-marker shrink-0 mt-1 transition-all duration-500",
                                            isBeingPlayed && "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        )}
                                    >
                                        {ayah.numberInSurah}
                                    </motion.div>
                                </div>
                                {translation && selectedEdition !== 'none' && (
                                    <p className={cn(
                                        "text-primary-light/70 font-sans tracking-normal",
                                        language === 'ar' ? "text-right" : "text-left",
                                        isBeingPlayed && "text-primary/60 font-medium"
                                    )} style={{ fontSize: `${Math.max(14, fontSize * 0.6)}px` }}>
                                        {translation.text}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div 
                    className="arabic-text text-right quran-text-justified text-primary-dark tracking-wide flex-1"
                    style={{ fontSize: `${fontSize}px` }}
                >
                    {currentPage.map((ayah) => {
                        let text = ayah.text;
                        if (surahContent.surah.number !== 1 && ayah.numberInSurah === 1) {
                            text = text.replace('بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', '').trim();
                        }
                        
                        const isBeingPlayed = audioAyahs[currentAudioIndex]?.number === ayah.number;

                        return (
                            <React.Fragment key={ayah.number}>
                                <span 
                                    id={`ayah-${ayah.number}`}
                                    className={cn(
                                        "hover:bg-accent/5 rounded-lg transition-all duration-500",
                                        isBeingPlayed && "bg-primary/20 text-primary font-bold px-2 py-1 rounded-xl shadow-sm ring-1 ring-primary/20"
                                    )}
                                >
                                    {text}
                                </span>
                                <motion.span 
                                    animate={isBeingPlayed ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : { scale: 1, rotate: 0 }}
                                    transition={{ repeat: isBeingPlayed ? Infinity : 0, duration: 2 }}
                                    className={cn(
                                        "verse-marker transition-all duration-500",
                                        isBeingPlayed && "bg-primary text-white border-primary shadow-md"
                                    )}
                                >
                                    {ayah.numberInSurah}
                                </motion.span>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

          {/* Page Footer */}
          <div className={cn("mt-8 pt-6 border-t border-accent/10 flex justify-between items-center text-[10px] font-bold text-accent/40 uppercase tracking-widest", !isRtl && "flex-row-reverse")}>
             <div className="flex gap-4">
                <span>{t('juz')} {currentPage[0]?.juz}</span>
                <span>{t('page')} {currentPage[0]?.page}</span>
             </div>
             <div className="flex gap-2 items-center bg-accent/5 p-1 px-3 rounded-full border border-accent/10">
                <span className="text-accent">{currentPageIndex + 1}</span>
                <span className="opacity-40">/</span>
                <span>{pages.length}</span>
             </div>
          </div>
        </div>

        {/* Page Controls */}
        <div className={cn("flex items-center justify-between gap-4 pt-4", !isRtl && "flex-row-reverse")}>
          <button 
            disabled={currentPageIndex === 0}
            onClick={() => {
                setCurrentPageIndex(p => p - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex-1 h-14 bg-secondary border border-primary/10 rounded-2xl flex items-center justify-center gap-2 font-bold text-primary disabled:opacity-30 shadow-sm active:scale-95 transition-all"
          >
            <ChevronRight className={cn("w-5 h-5", isRtl ? "rotate-180" : "rotate-0")} />
            <span>{t('prev')}</span>
          </button>
          
          <button 
            disabled={currentPageIndex === pages.length - 1}
            onClick={() => {
                setCurrentPageIndex(p => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex-1 h-14 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20 disabled:opacity-30 active:scale-95 transition-all"
          >
            <span>{t('next')}</span>
            <ChevronRight className={cn("w-5 h-5", isRtl ? "rotate-0" : "rotate-180")} />
          </button>
        </div>
        {/* Audio Player Fixed Control */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <div className="bg-secondary/90 backdrop-blur-xl rounded-full p-2 px-4 shadow-2xl border border-primary/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden">
                      {isPlaying ? (
                        <div className="flex gap-0.5 items-end h-4">
                            {[1,2,3,4].map(i => (
                                <motion.div 
                                    key={i} 
                                    animate={{ height: [4, 16, 4] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                    className="w-1 bg-primary rounded-full" 
                                />
                            ))}
                        </div>
                      ) : (
                        <Headphones size={20} />
                      )}
                   </div>
                   <div className="overflow-hidden min-w-0">
                      <h5 className="text-[10px] font-bold text-primary/40 uppercase tracking-widest truncate">
                        {reciters.find(r => r.id === selectedReciter)?.[language === 'ar' ? 'name' : 'englishName']}
                      </h5>
                      <p className="text-xs font-bold text-primary truncate">
                        {audioAyahs[currentAudioIndex] ? `${t('ayah')} ${audioAyahs[currentAudioIndex].numberInSurah}` : t('appName')}
                      </p>
                   </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentAudioIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentAudioIndex <= 0}
                    className="p-2 text-primary/40 hover:text-primary disabled:opacity-20 transition-colors"
                  >
                    <SkipBack size={20} className={isRtl ? "rotate-0" : "rotate-180"} />
                  </button>

                  <button 
                    onClick={togglePlay}
                    className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>

                   <button 
                    onClick={() => setCurrentAudioIndex(prev => Math.min(audioAyahs.length - 1, prev + 1))}
                    disabled={currentAudioIndex >= audioAyahs.length - 1}
                    className="p-2 text-primary/40 hover:text-primary disabled:opacity-20 transition-colors"
                  >
                    <SkipForward size={20} className={isRtl ? "rotate-0" : "rotate-180"} />
                  </button>

                  <button 
                    onClick={stopAudio}
                    className="p-2 text-primary/40 hover:text-red-500 transition-colors"
                  >
                    <Square size={20} fill="currentColor" />
                  </button>
                </div>
            </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="relative">
        <Search className={cn("absolute top-1/2 -translate-y-1/2 text-primary/30 w-5 h-5", isRtl ? "right-4" : "left-4")} />
        <input 
          type="text" 
          placeholder={t('search_surah')} 
          dir={isRtl ? 'rtl' : 'ltr'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full h-14 bg-secondary rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm border border-primary/5",
            isRtl ? "px-12 text-right" : "px-12 text-left"
          )}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-secondary/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredSurahs.map((surah) => (
            <button
              key={surah.number}
              onClick={() => handleSurahClick(surah.number)}
              className={cn(
                "flex items-center justify-between p-4 bg-secondary rounded-2xl shadow-sm border border-primary/5 hover:border-primary/20 hover:shadow-md transition-all group",
                !isRtl && "flex-row-reverse"
              )}
            >
              <div className={cn("flex items-center gap-4", !isRtl && "flex-row-reverse")}>
                <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold">
                   {surah.number}
                </div>
                <div className={cn("text-left", isRtl ? "text-right" : "text-left")}>
                  <h3 className="font-bold text-primary group-hover:text-primary-light transition-colors">{surah.englishName}</h3>
                  <p className="text-xs text-primary-light/60 font-medium uppercase tracking-tight">
                    {surah.revelationType === 'Meccan' ? t('revelation_meccan') : t('revelation_medinan')}
                  </p>
                </div>
              </div>
              <div className={cn(isRtl ? "text-right" : "text-left")}>
                <h3 className="font-display font-medium text-xl arabic-text">{surah.name}</h3>
                <p className="text-[10px] text-primary/40 font-bold uppercase">{surah.numberOfAyahs} {t('ayah')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

