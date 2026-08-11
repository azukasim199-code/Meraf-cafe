import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Phone, Clock, Coffee } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-[#08080A] text-zinc-400 text-xs py-10 border-t border-zinc-800/80 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="font-serif-luxury text-lg font-bold text-white">{t('cafeName')}</span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            {language === 'am'
              ? 'ከፍተኛ ጥራት ያለው የኢትዮጵያ ቡና፣ ባህላዊና ዘመናዊ ምግቦች በራፋኤል ሽጎሌ።'
              : 'Premium Ethiopian coffee, traditional breakfast, and delicious international dishes in Rafael shegole, Addis Ababa.'}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
            {language === 'am' ? 'አድራሻ እና ስልክ' : 'Location & Contact'}
          </h4>
          <div className="flex items-center gap-2 text-zinc-300">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Rafael shegole, Addis Ababa, Ethiopia</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Phone className="w-4 h-4 text-amber-500 shrink-0" />
            <span>+251 91 123 4567 / +251 11 612 3456</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
            {language === 'am' ? 'የስራ ሰዓት' : 'Opening Hours'}
          </h4>
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {language === 'am'
                ? 'ሰኞ - እሑድ፡ ከጠዋቱ 1:00 - ማታ 4:00 ሰዓት'
                : 'Monday - Sunday: 7:00 AM - 10:00 PM EAT'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-zinc-800/80 text-center text-zinc-500 text-[11px]">
        © {new Date().getFullYear()} MERAF CAFE. All rights reserved. Ethiopian Fine Coffee & Luxury Dining Experience.
      </div>
    </footer>
  );
};
