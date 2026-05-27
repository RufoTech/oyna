import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';

const NAV_ITEMS = [
  { id: 'dashboard', labelKey: 'sidebar.dashboard', icon: 'dashboard', path: '/dashboard' },
  {
    id: 'venues',
    labelKey: 'sidebar.venues',
    icon: 'location_on',
    path: '/venues',
    activePaths: ['/venues', '/addVenue', '/editVenue', '/mediaPricing', '/calendarAvailability'],
  },
  { id: 'addSpecs', labelKey: 'sidebar.addSpecs', icon: 'computer', path: '/addSpecs' },
  { id: 'simulation', labelKey: 'sidebar.simulation', icon: 'view_quilt', path: '/simulation' },
  { id: 'food', labelKey: 'sidebar.food', icon: 'restaurant_menu', path: '/food', activePaths: ['/food', '/addFood', '/editFood'] },
  { id: 'bookings', labelKey: 'sidebar.bookings', icon: 'event_available', path: '/bookings' },
];

const SETTINGS_ITEM = { labelKey: 'sidebar.settings', icon: 'settings' };

const Sidebar = ({ user, onLogout, isOpen, setIsOpen }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = location.pathname;

  const activeClass =
    'flex items-center gap-3 px-4 py-3 text-blue-700 dark:text-blue-300 font-bold border-r-2 border-blue-600 bg-slate-200/50 dark:bg-slate-800/50 font-manrope text-sm tracking-tight rounded-l-xl cursor-pointer';
  const inactiveClass =
    'flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors duration-200 font-manrope text-sm font-medium tracking-tight rounded-xl group cursor-pointer';

  const isActive = (item) => {
    if (item.activePaths) {
      return item.activePaths.some(p => pathname.startsWith(p)) || pathname === item.path;
    }
    return pathname === item.path || (item.id === 'dashboard' && pathname === '/');
  };

  return (
    <aside
      className={`h-screen ${isOpen ? 'w-64' : 'w-20'} fixed left-0 top-0 bg-slate-50 dark:bg-slate-900 flex flex-col py-6 z-50 transition-all duration-300 border-r border-slate-100 dark:border-slate-800`}
    >
      <div className={`px-6 mb-10 flex ${isOpen ? 'justify-start' : 'justify-center'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 bg-primary-container hover:bg-primary rounded-lg flex shrink-0 items-center justify-center text-white shadow-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <h2 className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white whitespace-nowrap">Oyna</h2>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold whitespace-nowrap">{t('sidebar.adminPanel')}</p>
          </div>
        </div>
      </div>

      <nav className={`flex-1 space-y-1 ${isOpen ? 'px-4' : 'px-2'}`}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <div key={item.id} onClick={() => navigate(item.path)} className={active ? activeClass : inactiveClass}>
              <span
                className="material-symbols-outlined shrink-0"
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'w-0 opacity-0 hidden'}`}
              >
                {t(item.labelKey)}
              </span>
            </div>
          );
        })}

        <div 
          className={inactiveClass} 
          onClick={() => setIsSettingsOpen(true)}
        >
          <span className="material-symbols-outlined shrink-0 group-hover:text-primary">{SETTINGS_ITEM.icon}</span>
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'w-0 opacity-0 hidden'}`}
          >
            {t(SETTINGS_ITEM.labelKey)}
          </span>
        </div>
      </nav>

      <div className={`mt-auto space-y-1 ${isOpen ? 'px-4' : 'px-2'}`}>
        <div
          onClick={() => navigate('/help')}
          className={pathname === '/help' ? activeClass : inactiveClass}
        >
          <span
            className="material-symbols-outlined shrink-0"
            style={pathname === '/help' ? { fontVariationSettings: "'FILL' 1" } : {}}
          >help</span>
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'w-0 opacity-0 hidden'}`}
          >
            {t('sidebar.help')}
          </span>
        </div>
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <div className={`flex items-center gap-3 py-2 ${isOpen ? 'px-4 justify-between' : 'px-0 justify-center'}`}>
            <img
              alt="User"
              className="w-8 h-8 rounded-full bg-slate-200 shrink-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3OxnjCvD_4COxGMUakNiB2dgwJPqSJQrC-IL7fB1J34BvxtUT8czn4z0lYEOaaTZrYtcXGhNYX4WpVEC0BrlxS3gpp-3eMRpI-8T5Y1fr0qqDHyTyrHjXQVcbVyTfpomzaENlG0VDhiBY3vOgTtGDvOKwZAerT5mSQ6RnOPvrjl50aGmq-02177OqqtMRduMEv9Haw2ik2wtKGnPfsWLl5I4sBM5mrrM275L7no9Zlitx3srcO_K1bcH584acg8KIM71t2h8GFV4"
            />

            <div className={`flex-1 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'w-0 opacity-0 hidden'}`}>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Admin İstifadəçi</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@luminous.com'}</p>
            </div>

            <button onClick={onLogout} className={`text-slate-400 hover:text-error transition-colors shrink-0 ${isOpen ? '' : 'hidden'}`}>
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>

          {!isOpen && (
            <button onClick={onLogout} className="w-full flex items-center justify-center py-2 mt-2 text-slate-400 hover:text-error transition-colors">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          )}
        </div>
      </div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </aside>
  );
};

export default Sidebar;
