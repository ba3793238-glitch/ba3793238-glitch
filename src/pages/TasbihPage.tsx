import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Settings, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

export default function TasbihPage() {
  const { t, isRtl, language } = useLanguage();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [vibrate, setVibrate] = useState(true);

  const handleIncrement = () => {
    if (vibrate && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setCount(prev => prev + 1);
  };

  useEffect(() => {
     if (count > 0 && count % target === 0) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
     }
  }, [count, target]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 pb-10"
    >
      <div className="flex items-center gap-4 bg-secondary/50 p-2 px-4 rounded-2xl border border-primary/5">
         {[33, 99, 1000].map(val => (
           <button 
             key={val}
             onClick={() => setTarget(val)}
             className={cn(
               "px-4 py-1 rounded-xl text-xs font-bold transition-all",
               target === val ? "bg-primary text-white shadow-md" : "text-primary/40 hover:text-primary/60"
             )}
           >
             {val}
           </button>
         ))}
      </div>

      <div className="relative flex items-center justify-center group">
         {/* Outer circle decoration */}
         <div className="absolute w-72 h-72 border-4 border-dashed border-primary/10 rounded-full animate-spin-slow group-hover:border-primary/20 transition-all duration-1000" />
         
         <button
           onClick={handleIncrement}
           className="relative w-64 h-64 bg-secondary rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-primary/5 flex flex-col items-center justify-center group active:scale-95 transition-all duration-100 overflow-hidden"
         >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-active:opacity-100 transition-opacity" />
            <motion.span 
              key={count}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl font-display font-bold text-primary tabular-nums"
            >
              {count}
            </motion.span>
            <div className="text-primary/20 font-bold uppercase tracking-widest text-[10px] mt-4">
                {language === 'ar' ? 'انقر للتسبيح' : 'Click to praise'}
            </div>
         </button>
      </div>

      <div className="flex gap-4">
         <button 
           onClick={() => setCount(0)}
           className="w-14 h-14 bg-secondary rounded-2xl shadow-sm border border-black/5 flex items-center justify-center text-primary/40 hover:text-primary hover:bg-red-50 hover:border-red-100 transition-all"
         >
           <RefreshCcw size={20} />
         </button>
         <button 
           className={cn(
             "px-8 h-14 rounded-2xl shadow-sm border font-bold flex items-center gap-2 transition-all",
             vibrate ? "bg-primary/5 border-primary/20 text-primary" : "bg-secondary border-black/5 text-primary/40"
           )}
           onClick={() => setVibrate(!vibrate)}
         >
           <span className="text-sm">{language === 'ar' ? 'الاهتزاز' : 'Vibrate'}</span>
           <div className={cn("w-2 h-2 rounded-full", vibrate ? "bg-primary" : "bg-primary/20")} />
         </button>
      </div>

      <div className="text-center space-y-2">
         <p className="text-sm font-medium text-primary/40">
             {language === 'ar' ? `عدد الدورات: ${Math.floor(count / target)}` : `Cycles: ${Math.floor(count / target)}`}
         </p>
         <div className="flex gap-1 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn(
                "w-1 h-3 rounded-full transition-all",
                i < Math.floor(count / target) ? "bg-accent" : "bg-primary/5"
              )} />
            ))}
         </div>
      </div>
    </motion.div>
  );
}

