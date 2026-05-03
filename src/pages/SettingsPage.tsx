import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Volume2, User, Globe, Shield, Info, LogOut, ChevronLeft, Sunrise, Sun, Sunset, Moon, CloudSun, CloudMoon, Map, Compass } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { t, language, setLanguage, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [reminders, setReminders] = useState(true);
  const [athanVolume, setAthanVolume] = useState(() => {
    const saved = localStorage.getItem('athanVolume');
    return saved ? parseFloat(saved) : 0.7;
  });
  const [sound, setSound] = useState(() => {
    return localStorage.getItem('athanSound') || t('makkah');
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, setUser] = useState(auth?.currentUser);

  const athanOptions = [
    { id: 'makkah', label: t('makkah'), url: 'https://www.islamcan.com/audio/adan/azan1.mp3' },
    { id: 'madinah', label: t('madinah'), url: 'https://www.islamcan.com/audio/adan/azan20.mp3' },
    { id: 'egypt', label: t('egypt'), url: 'https://www.islamcan.com/audio/adan/azan2.mp3' },
    { id: 'aqsa', label: t('aqsa'), url: 'https://www.islamcan.com/audio/adan/azan7.mp3' },
    { id: 'turkey', label: t('turkey'), url: 'https://www.islamcan.com/audio/adan/azan15.mp3' },
    { id: 'morocco', label: t('morocco'), url: 'https://www.islamcan.com/audio/adan/azan18.mp3' },
  ];

  const handleSoundChange = (label: string) => {
    setSound(label);
    localStorage.setItem('athanSound', label);
    const option = athanOptions.find(o => o.label === label);
    if (option) {
       localStorage.setItem('athanUrl', option.url);
    }
  };

  const handleVolumeChange = (val: string) => {
    const volume = parseFloat(val);
    setAthanVolume(volume);
    localStorage.setItem('athanVolume', val);
    const audio = document.getElementById('athan-preview') as HTMLAudioElement;
    if (audio) {
      audio.volume = volume;
    }
  };

  const togglePreview = () => {
    const audio = document.getElementById('athan-preview') as HTMLAudioElement;
    if (audio) {
      audio.volume = athanVolume;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        const option = athanOptions.find(o => o.label === sound);
        if (option) {
          audio.src = option.url;
          audio.play();
          setIsPlaying(true);
        }
      }
    }
  };
  
  // Calculation Settings
  const [calcSettings, setCalcSettings] = useState(() => {
    const saved = localStorage.getItem('calcSettings');
    return saved ? JSON.parse(saved) : {
      method: 'MuslimWorldLeague',
      madhab: 'Shafi'
    };
  });

  const handleCalcChange = (key: string, value: string) => {
    const newSettings = { ...calcSettings, [key]: value };
    setCalcSettings(newSettings);
    localStorage.setItem('calcSettings', JSON.stringify(newSettings));
  };
  
  // Custom reminder times state
  const [prayerReminders, setPrayerReminders] = useState(() => {
    const saved = localStorage.getItem('prayerReminders');
    return saved ? JSON.parse(saved) : {
      fajr: '04:30',
      dhuhr: '12:00',
      asr: '15:30',
      maghrib: '18:30',
      isha: '20:00',
      morning: '06:00',
      evening: '17:00'
    };
  });

  const handleTimeChange = (id: string, value: string) => {
    const newReminders = { ...prayerReminders, [id]: value };
    setPrayerReminders(newReminders);
    localStorage.setItem('prayerReminders', JSON.stringify(newReminders));
  };

  const handleLogin = async () => {
    if (!auth) {
        alert('Firebase is not yet configured.');
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        setUser(null);
    }
  };

  const sections = [
    {
      title: t('notifications'),
      items: [
        { label: t('reminders'), icon: Bell, type: 'toggle', value: reminders, onChange: setReminders },
        { 
          label: t('athan_sounds'), 
          icon: Volume2, 
          type: 'select', 
          value: sound, 
          options: athanOptions.map(o => o.label),
          onChange: handleSoundChange,
          isPreviewable: true
        },
        { 
          label: t('athan_volume'), 
          icon: Volume2, 
          type: 'range', 
          value: athanVolume, 
          onChange: handleVolumeChange 
        },
      ]
    },
    {
      title: t('jurisprudential_settings'),
      items: [
        { 
          id: 'method', 
          label: t('calculation_method'), 
          icon: Map,
          type: 'select', 
          value: calcSettings.method, 
          options: ['MuslimWorldLeague', 'UmmAlQura', 'Egyptian', 'Dubai', 'Kuwait', 'Qatar', 'Turkey'],
          labels: {
            'MuslimWorldLeague': 'رابطة العالم الإسلامي / MWL',
            'UmmAlQura': 'أم القرى / Umm Al-Qura',
            'Egyptian': 'الهيئة المصرية للمساحة / Egypt',
            'Dubai': 'دبي / Dubai',
            'Kuwait': 'الكويت / Kuwait',
            'Qatar': 'قطر / Qatar',
            'Turkey': 'تركيا / Turkey'
          },
          onChange: (val: string) => handleCalcChange('method', val)
        },
        { 
          id: 'madhab', 
          label: t('madhab'), 
          icon: Compass,
          type: 'select', 
          value: calcSettings.madhab, 
          options: ['Shafi', 'Hanafi'],
          labels: {
            'Shafi': t('shafi'),
            'Hanafi': t('hanafi')
          },
          onChange: (val: string) => handleCalcChange('madhab', val)
        },
      ],
      isDropdown: true
    },
    {
      title: t('custom_reminders'),
      items: [
        { id: 'fajr', label: t('fajr'), icon: Sunrise, value: prayerReminders.fajr },
        { id: 'dhuhr', label: t('dhuhr'), icon: Sun, value: prayerReminders.dhuhr },
        { id: 'asr', label: t('asr'), icon: CloudSun, value: prayerReminders.asr },
        { id: 'maghrib', label: t('maghrib'), icon: Sunset, value: prayerReminders.maghrib },
        { id: 'isha', label: t('isha'), icon: Moon, value: prayerReminders.isha },
        { id: 'morning', label: t('morning'), icon: CloudSun, value: prayerReminders.morning },
        { id: 'evening', label: t('evening'), icon: CloudMoon, value: prayerReminders.evening },
      ],
      isCustom: true
    },
    {
      title: t('profile'),
      items: [
        { 
          label: t('language'), 
          icon: Globe, 
          type: 'select', 
          value: language, 
          options: ['ar', 'en'],
          labels: {
            'ar': 'العربية',
            'en': 'English'
          },
          onChange: (val: string) => setLanguage(val as any)
        },
      ],
      isDropdown: true
    },
    {
      title: 'Support',
      items: [
        { label: 'About', icon: Info, type: 'link' },
        { label: 'Privacy', icon: Shield, type: 'link' },
        { 
          label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', 
          icon: theme === 'dark' ? Sun : Moon, 
          type: 'toggle', 
          value: theme === 'dark', 
          onChange: toggleTheme 
        },
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20"
    >
      {/* Profile Section */}
      <section className="bg-secondary rounded-[32px] p-8 shadow-sm border border-primary/5 flex flex-col items-center text-center gap-4">
        {user ? (
          <>
            <img src={user.photoURL || ''} alt="profile" className="w-20 h-20 rounded-full border-4 border-primary/10" />
            <div>
              <h3 className="font-bold text-xl text-primary">{user.displayName}</h3>
              <p className="text-sm text-primary/40 font-medium">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest mt-2 hover:bg-red-50 p-2 px-4 rounded-xl transition-colors">
              <LogOut size={16} />
              {t('sign_out')}
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/5 border-4 border-primary/10 flex items-center justify-center text-primary/20">
               <User size={40} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-primary">{language === 'ar' ? 'أهلاً بك زائرنا' : 'Welcome Guest'}</h3>
              <p className="text-sm text-primary/40 font-medium">{language === 'ar' ? 'سجل دخولك لحفظ بياناتك ومتابعة تقدمك' : 'Sign in to save your data and track progress'}</p>
            </div>
            <button 
              onClick={handleLogin}
              className="mt-4 w-full h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all px-6"
            >
              <img src="https://api.iconify.design/logos:google-icon.svg" className="w-5 h-5 bg-white p-0.5 rounded-full" alt="google" />
              {t('sign_in_google')}
            </button>
          </>
        )}
      </section>

      {/* Settings Options */}
      {sections.map((section, idx) => (
        <div key={idx} className="space-y-3">
          <h4 className={cn(
            "text-xs font-bold uppercase tracking-[0.2em] text-primary/30",
            isRtl ? "mr-4" : "ml-4"
          )}>{section.title}</h4>
          <div className="bg-secondary rounded-[32px] overflow-hidden shadow-sm border border-primary/5">
            {(section as any).isCustom ? (
              <div className="p-4 grid grid-cols-1 gap-3">
                {section.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-primary/[0.02] rounded-2xl border border-primary/5 hover:bg-primary/[0.04] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-secondary rounded-xl shadow-sm text-primary">
                        <item.icon size={18} />
                      </div>
                      <span className="font-bold text-primary/70">{item.label}</span>
                    </div>
                    <input 
                      type="time" 
                      value={item.value}
                      onChange={(e) => handleTimeChange(item.id, e.target.value)}
                      className="bg-secondary px-4 py-2 rounded-xl border border-primary/10 text-primary font-bold focus:ring-2 focus:ring-primary/20 outline-none shadow-sm cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            ) : (section as any).isDropdown ? (
               <div className="divide-y divide-primary/5">
                 {section.items.map((item: any) => (
                   <div key={item.id} className="p-5 flex flex-col gap-2 hover:bg-primary/[0.01] transition-colors">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                            <item.icon size={18} />
                          </div>
                          <span className="font-bold text-primary/80">{item.label}</span>
                        </div>
                        <div className="relative group">
                          <select 
                            value={item.value} 
                            onChange={(e) => item.onChange?.(e.target.value)}
                            className={cn(
                                "bg-secondary border border-primary/10 rounded-xl p-2.5 text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-sm cursor-pointer",
                                isRtl ? "px-4 pr-10" : "px-4 pl-10"
                            )}
                          >
                            {item.options.map((opt: string) => (
                              <option key={opt} value={opt}>{item.labels?.[opt] || opt}</option>
                            ))}
                          </select>
                          <ChevronLeft className={cn(
                              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 pointer-events-none -rotate-90",
                              isRtl ? "left-3" : "right-3"
                          )} />
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
              section.items.map((item, i) => (
                <div key={i} className={cn(
                  "flex items-center justify-between p-5 hover:bg-primary/[0.01] transition-colors",
                  i !== section.items.length - 1 && "border-b border-primary/5"
                )}>
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                      <item.icon size={20} />
                    </div>
                    <span className="font-semibold text-primary/80">{item.label}</span>
                  </div>
                  
                  {item.type === 'toggle' && (
                    <button 
                      onClick={() => item.onChange?.(!item.value)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative p-1",
                        item.value ? "bg-primary" : "bg-primary/10"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-secondary rounded-full transition-all shadow-sm",
                        item.value 
                          ? (isRtl ? "-translate-x-6" : "translate-x-6") 
                          : "translate-x-0"
                      )} />
                    </button>
                  )}

                  {item.type === 'select' && (
                     <div className="flex items-center gap-3">
                        {item.isPreviewable && (
                          <button 
                            onClick={togglePreview}
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                              isPlaying ? "bg-accent/20 text-accent animate-pulse" : "bg-primary/5 text-primary hover:bg-primary/10"
                            )}
                          >
                             {isPlaying ? <div className="w-2 h-2 bg-accent rounded-full" /> : <Volume2 size={16} />}
                          </button>
                        )}
                        <select 
                          value={item.value} 
                          onChange={(e) => item.onChange?.(e.target.value)}
                          className={cn(
                              "bg-primary/5 border-none rounded-xl p-2 px-3 text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20 appearance-none",
                              isRtl ? "text-right" : "text-left"
                          )}
                        >
                          {item.options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                     </div>
                  )}

                  {item.type === 'range' && (
                    <div className="flex items-center gap-4 w-1/3">
                       <Volume2 size={16} className="text-primary/30" />
                       <input 
                         type="range" 
                         min="0" 
                         max="1" 
                         step="0.1" 
                         value={item.value}
                         onChange={(e) => item.onChange?.(e.target.value)}
                         className="flex-1 accent-primary h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer"
                       />
                       <span className="text-[10px] font-bold text-primary/40 w-6">{Math.round(item.value * 100)}%</span>
                    </div>
                  )}

                  {item.type === 'link' && (
                    <ChevronLeft size={18} className={cn("text-primary/20", !isRtl && "rotate-180")} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      <div className="text-center pt-4 opacity-20 hover:opacity-100 transition-opacity">
         <p className="text-[10px] font-bold uppercase tracking-[0.3em]">{t('app_version')}</p>
      </div>

      <audio id="athan-preview" onEnded={() => setIsPlaying(false)} className="hidden" />
    </motion.div>
  );
}

