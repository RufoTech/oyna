import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const SettingsModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const [language, setLanguage] = useState(() => {
    return i18n.language || 'az';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    i18n.changeLanguage(language.toLowerCase());
  }, [language, i18n]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">settings</span>
            </div>
            <h2 className="text-xl font-bold font-headline text-slate-900 dark:text-white uppercase tracking-tight">{t('settings.title')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.darkMode')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.darkModeDesc')}</p>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  {darkMode ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
            </button>
          </div>

          {/* Language Selection */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.language')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.languageDesc')}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
                { code: 'en', label: 'English', flag: '🇺🇸' },
                { code: 'ru', label: 'Русский', flag: '🇷🇺' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    language === lang.code 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{lang.code === 'az' ? 'AZE' : lang.code === 'en' ? 'ENG' : 'RUS'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            {t('settings.done')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
