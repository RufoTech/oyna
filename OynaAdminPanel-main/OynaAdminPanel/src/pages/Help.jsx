import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const AccordionItem = ({ icon, title, children, defaultOpen = false, color = 'primary' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorMap = {
    primary: {
      iconBg: 'bg-primary/10 text-primary',
      border: 'border-primary/20',
      ring: 'ring-primary/10',
    },
    emerald: {
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      ring: 'ring-emerald-100 dark:ring-emerald-900/30',
    },
    amber: {
      iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      ring: 'ring-amber-100 dark:ring-amber-900/30',
    },
    violet: {
      iconBg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
      border: 'border-violet-200 dark:border-violet-800',
      ring: 'ring-violet-100 dark:ring-violet-900/30',
    },
    rose: {
      iconBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      ring: 'ring-rose-100 dark:ring-rose-900/30',
    },
    sky: {
      iconBg: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-800',
      ring: 'ring-sky-100 dark:ring-sky-900/30',
    },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <div className={`bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border ${isOpen ? c.border : 'border-transparent dark:border-slate-800'} shadow-sm transition-all duration-300 ${isOpen ? `ring-4 ${c.ring}` : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left group cursor-pointer"
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg} transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-105'}`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <span className="flex-1 text-base font-extrabold text-on-surface dark:text-white tracking-tight">{title}</span>
        <span className={`material-symbols-outlined text-on-surface-variant dark:text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-400 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pt-0 space-y-4 text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

const StepBadge = ({ number }) => (
  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[11px] font-black shrink-0">{number}</span>
);

const FieldRow = ({ icon, label, description, required = false }) => (
  <div className="flex items-start gap-3 bg-surface-container-low dark:bg-slate-800/50 p-3.5 rounded-xl">
    <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">{icon}</span>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-on-surface dark:text-white">{label}</span>
        {required && <span className="text-[9px] font-black uppercase tracking-widest text-error bg-error/10 px-1.5 py-0.5 rounded">*</span>}
      </div>
      <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">{description}</p>
    </div>
  </div>
);

const TipBox = ({ children }) => (
  <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl">
    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg shrink-0">lightbulb</span>
    <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">{children}</p>
  </div>
);

const Help = () => {
  const { t } = useTranslation();

  return (
    <>
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      <div className="px-8 max-w-4xl mx-auto pb-16">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-3xl">help</span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface dark:text-white font-headline">
                {t('help.title')}
              </h1>
              <p className="text-on-surface-variant dark:text-slate-400 font-medium mt-0.5">
                {t('help.subtitle')}
              </p>
            </div>
          </div>
        </header>

        {/* Sections */}
        <div className="space-y-4">

          {/* ─── VENUE CREATION OVERVIEW ─── */}
          <AccordionItem icon="add_location_alt" title={t('help.venueOverview.title')} defaultOpen={true} color="primary">
            <p>{t('help.venueOverview.intro')}</p>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-3">
                <StepBadge number="1" />
                <span className="font-bold text-on-surface dark:text-white">{t('help.venueOverview.step1')}</span>
              </div>
              <div className="flex items-center gap-3">
                <StepBadge number="2" />
                <span className="font-bold text-on-surface dark:text-white">{t('help.venueOverview.step2')}</span>
              </div>
              <div className="flex items-center gap-3">
                <StepBadge number="3" />
                <span className="font-bold text-on-surface dark:text-white">{t('help.venueOverview.step3')}</span>
              </div>
            </div>
            <TipBox>{t('help.venueOverview.tip')}</TipBox>
          </AccordionItem>

          {/* ─── STEP 1: BASIC INFO ─── */}
          <AccordionItem icon="info" title={t('help.step1.title')} color="emerald">
            <p>{t('help.step1.intro')}</p>
            <div className="space-y-2 mt-2">
              <FieldRow icon="badge" label={t('help.step1.name')} description={t('help.step1.nameDesc')} required />
              <FieldRow icon="image" label={t('help.step1.logo')} description={t('help.step1.logoDesc')} />
              <FieldRow icon="category" label={t('help.step1.category')} description={t('help.step1.categoryDesc')} required />
              <FieldRow icon="format_quote" label={t('help.step1.slogan')} description={t('help.step1.sloganDesc')} />
              <FieldRow icon="description" label={t('help.step1.description')} description={t('help.step1.descriptionDesc')} />
              <FieldRow icon="map" label={t('help.step1.location')} description={t('help.step1.locationDesc')} required />
              <FieldRow icon="apartment" label={t('help.step1.branches')} description={t('help.step1.branchesDesc')} />
            </div>
            <TipBox>{t('help.step1.tip')}</TipBox>
          </AccordionItem>

          {/* ─── STEP 2: MEDIA & PRICING ─── */}
          <AccordionItem icon="collections" title={t('help.step2.title')} color="violet">
            <p>{t('help.step2.intro')}</p>
            <div className="space-y-2 mt-2">
              <FieldRow icon="photo_library" label={t('help.step2.gallery')} description={t('help.step2.galleryDesc')} required />
              <FieldRow icon="attach_money" label={t('help.step2.pricing')} description={t('help.step2.pricingDesc')} required />
            </div>
            <TipBox>{t('help.step2.tip')}</TipBox>
          </AccordionItem>

          {/* ─── STEP 3: CALENDAR & CONTACT ─── */}
          <AccordionItem icon="calendar_month" title={t('help.step3.title')} color="amber">
            <p>{t('help.step3.intro')}</p>
            <div className="space-y-2 mt-2">
              <FieldRow icon="schedule" label={t('help.step3.hours')} description={t('help.step3.hoursDesc')} required />
              <FieldRow icon="toggle_on" label={t('help.step3.toggle24')} description={t('help.step3.toggle24Desc')} />
              <FieldRow icon="call" label={t('help.step3.phone')} description={t('help.step3.phoneDesc')} required />
              <FieldRow icon="mail" label={t('help.step3.email')} description={t('help.step3.emailDesc')} required />
              <FieldRow icon="camera" label={t('help.step3.instagram')} description={t('help.step3.instagramDesc')} required />
              <FieldRow icon="chat" label={t('help.step3.whatsapp')} description={t('help.step3.whatsappDesc')} required />
              <FieldRow icon="public" label={t('help.step3.website')} description={t('help.step3.websiteDesc')} />
            </div>
            <TipBox>{t('help.step3.tip')}</TipBox>
          </AccordionItem>

          {/* ─── SPECS ─── */}
          <AccordionItem icon="computer" title={t('help.specs.title')} color="sky">
            <p>{t('help.specs.intro')}</p>
            <div className="space-y-2 mt-2">
              <FieldRow icon="devices" label={t('help.specs.tiers')} description={t('help.specs.tiersDesc')} />
              <FieldRow icon="memory" label={t('help.specs.hardware')} description={t('help.specs.hardwareDesc')} />
              <FieldRow icon="mouse" label={t('help.specs.accessories')} description={t('help.specs.accessoriesDesc')} />
              <FieldRow icon="star" label={t('help.specs.features')} description={t('help.specs.featuresDesc')} />
              <FieldRow icon="auto_awesome_motion" label={t('help.specs.packages')} description={t('help.specs.packagesDesc')} />
            </div>
            <TipBox>{t('help.specs.tip')}</TipBox>
          </AccordionItem>

          {/* ─── FOOD MENU ─── */}
          <AccordionItem icon="restaurant_menu" title={t('help.food.title')} color="rose">
            <p>{t('help.food.intro')}</p>
            <div className="space-y-2 mt-2">
              <FieldRow icon="fastfood" label={t('help.food.name')} description={t('help.food.nameDesc')} required />
              <FieldRow icon="attach_money" label={t('help.food.price')} description={t('help.food.priceDesc')} required />
              <FieldRow icon="image" label={t('help.food.image')} description={t('help.food.imageDesc')} />
              <FieldRow icon="label" label={t('help.food.category')} description={t('help.food.categoryDesc')} required />
              <FieldRow icon="location_on" label={t('help.food.venue')} description={t('help.food.venueDesc')} required />
            </div>
          </AccordionItem>

          {/* ─── BOOKINGS ─── */}
          <AccordionItem icon="event_available" title={t('help.bookings.title')} color="emerald">
            <p>{t('help.bookings.intro')}</p>
            <div className="space-y-2 mt-2">
              <FieldRow icon="pending_actions" label={t('help.bookings.pending')} description={t('help.bookings.pendingDesc')} />
              <FieldRow icon="check_circle" label={t('help.bookings.accept')} description={t('help.bookings.acceptDesc')} />
              <FieldRow icon="cancel" label={t('help.bookings.reject')} description={t('help.bookings.rejectDesc')} />
              <FieldRow icon="search" label={t('help.bookings.search')} description={t('help.bookings.searchDesc')} />
            </div>
          </AccordionItem>

          {/* ─── DASHBOARD ─── */}
          <AccordionItem icon="dashboard" title={t('help.dashboard.title')} color="primary">
            <p>{t('help.dashboard.intro')}</p>
            <div className="space-y-2 mt-2">
              <FieldRow icon="analytics" label={t('help.dashboard.stats')} description={t('help.dashboard.statsDesc')} />
              <FieldRow icon="bar_chart" label={t('help.dashboard.chart')} description={t('help.dashboard.chartDesc')} />
              <FieldRow icon="download" label={t('help.dashboard.export')} description={t('help.dashboard.exportDesc')} />
            </div>
          </AccordionItem>

          {/* ─── STATUSES ─── */}
          <AccordionItem icon="flag" title={t('help.statuses.title')} color="amber">
            <p>{t('help.statuses.intro')}</p>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-3 bg-surface-container-low dark:bg-slate-800/50 p-3.5 rounded-xl">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">DRAFT</span>
                <span className="text-xs text-on-surface-variant dark:text-slate-400">{t('help.statuses.draft')}</span>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-low dark:bg-slate-800/50 p-3.5 rounded-xl">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">ACTIVE</span>
                <span className="text-xs text-on-surface-variant dark:text-slate-400">{t('help.statuses.active')}</span>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-low dark:bg-slate-800/50 p-3.5 rounded-xl">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">TEMP_CLOSED</span>
                <span className="text-xs text-on-surface-variant dark:text-slate-400">{t('help.statuses.tempClosed')}</span>
              </div>
            </div>
          </AccordionItem>

        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-[2rem] p-8 text-center anim-card">
          <h3 className="text-xl font-headline font-bold text-on-surface dark:text-white mb-6">
            {t('help.contact.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                <span className="material-symbols-outlined">call</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant dark:text-slate-500 mb-1">{t('help.contact.phoneLabel')}</p>
                <p className="text-sm font-bold text-on-surface dark:text-white">+994 55 802 70 09</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant dark:text-slate-500 mb-1">{t('help.contact.emailLabel')}</p>
                <p className="text-sm font-bold text-on-surface dark:text-white">rainnovationsmmc@gmail.com</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                <span className="material-symbols-outlined">chat</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant dark:text-slate-500 mb-1">{t('help.contact.chatLabel')}</p>
                <p className="text-sm font-bold text-on-surface dark:text-white">{t('help.contact.chatDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Help;
