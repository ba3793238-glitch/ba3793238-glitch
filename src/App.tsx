import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Clock, Heart, Settings, User, Bell, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// Pages
import HomePage from './pages/HomePage';
import QuranPage from './pages/QuranPage';
import PrayerPage from './pages/PrayerPage';
import DhikrPage from './pages/DhikrPage';
import SettingsPage from './pages/SettingsPage';
import TasbihPage from './pages/TasbihPage';
import HadithPage from './pages/HadithPage';

function AppContent() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const [notification, setNotification] = useState<string | null>(null);
  const { t, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  // Background Reminder Checker
  useEffect(() => {
    let lastPlayedTime = '';

    const checkReminders = () => {
      const saved = localStorage.getItem('prayerReminders');
      if (!saved) return;
      
      const config = JSON.parse(saved);
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // Don't replay in the same minute
      if (lastPlayedTime === currentTime) return;

      const prayerLabels: Record<string, string> = {
        fajr: t('fajr'),
        dhuhr: t('dhuhr'),
        asr: t('asr'),
        maghrib: t('maghrib'),
        isha: t('isha'),
        morning: t('morning'),
        evening: t('evening')
      };

      for (const [id, time] of Object.entries(config)) {
        if (time === currentTime) {
          lastPlayedTime = currentTime;
          setNotification(`${t('athan_notification')}${prayerLabels[id] || id}`);
          
          // Play selected Athan if it's a prayer
          const isPrayer = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(id);
          if (isPrayer) {
            const athanUrl = localStorage.getItem('athanUrl') || 'https://www.islamcan.com/audio/adan/azan1.mp3';
            const audio = new Audio(athanUrl);
            audio.play().catch(e => console.error('Audio play failed:', e));
          }

          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          
          // Clear notification after 30 seconds
          setTimeout(() => setNotification(null), 30000);
        }
      }
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [t]);

  const navItems = [
    { path: '/', icon: Home, label: t('home') },
    { path: '/hadith', icon: Quote, label: t('hadith') },
    { path: '/quran', icon: BookOpen, label: t('quran') },
    { path: '/prayer', icon: Clock, label: t('prayer') },
    { path: '/dhikr', icon: Heart, label: t('dhikr') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <div className={cn(
      "min-h-screen pb-24 bg-warm-bg transition-colors duration-300 overflow-x-hidden",
      isRtl ? "font-arabic" : "font-sans"
    )}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-primary/90 backdrop-blur-md text-white p-4 shadow-lg flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
           <button 
             onClick={toggleTheme}
             className="p-2 mr-2 bg-white/20 rounded-full hover:bg-white/30 transition-all hover:rotate-12 active:scale-95"
           >
             {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
           </button>
           <img src="https://api.iconify.design/heroicons:book-open-solid.svg?color=%23ffffff" className="w-8 h-8 opacity-80" alt="logo" />
           <h1 className="font-display font-bold text-xl tracking-tight">{t('appName')}</h1>
        </div>
        <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
          <User className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 min-w-[280px]"
          >
            <div className="p-2 bg-white/20 rounded-full">
               <Bell className="w-5 h-5" />
            </div>
            <p className="font-bold text-sm text-center w-full">{notification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <AnimatePresence mode="wait">
          <div key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/quran" element={<QuranPage />} />
              <Route path="/prayer" element={<PrayerPage />} />
              <Route path="/dhikr" element={<DhikrPage />} />
              <Route path="/hadith" element={<HadithPage />} />
              <Route path="/tasbih" element={<TasbihPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-secondary/95 backdrop-blur-lg border-t border-primary/10 px-2 py-3 md:py-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = activeTab === item.path || (item.path !== '/' && activeTab.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300",
                  isActive ? "text-primary scale-110" : "text-primary/40 hover:text-primary/60"
                )}
              >
                <div className={cn(
                  "p-1 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10 shadow-inner" : ""
                )}>
                  <item.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-0"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

