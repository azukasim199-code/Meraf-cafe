import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
      <Globe className="w-4 h-4 text-amber-400 ml-1.5" />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
          language === 'en'
            ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('am')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
          language === 'am'
            ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        አማርኛ
      </button>
    </div>
  );
};
