import React, { useState } from 'react';
import { useGetDashboardStatsQuery } from '../store/api/dashboardApi';
import { useLazyExportReservationsQuery } from '../store/api/reservationsApi';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const PERIODS = [
  { key: '1m', labelKey: 'dashboard.periods.1m.label', descKey: 'dashboard.periods.1m.desc', icon: 'date_range' },
  { key: '3m', labelKey: 'dashboard.periods.3m.label', descKey: 'dashboard.periods.3m.desc', icon: 'calendar_month' },
  { key: '6m', labelKey: 'dashboard.periods.6m.label', descKey: 'dashboard.periods.6m.desc', icon: 'event_note' },
  { key: '1y', labelKey: 'dashboard.periods.1y.label', descKey: 'dashboard.periods.1y.desc', icon: 'calendar_today' },
];

const Dashboard = () => {
  const { t, i18n } = useTranslation();

  const STATUS_MAP = {
    pending: t('common.status.pending'),
    accepted: t('common.status.accepted'),
    rejected: t('common.status.rejected'),
    canceled: t('common.status.canceled'),
  };
  const { data, isLoading, error } = useGetDashboardStatsQuery();
  const [triggerExport, { isFetching: isExporting }] = useLazyExportReservationsQuery();
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1m');

  const handleExport = async () => {
    try {
      const result = await triggerExport({ period: selectedPeriod }).unwrap();
      if (!result || result.length === 0) {
        toast.info(t('dashboard.export.noData'));
        return;
      }

      // Map data to Translated column names
      const rows = result.map((r, idx) => ({
        [t('dashboard.export.headers.no')]: idx + 1,
        [t('dashboard.export.headers.code')]: r.reservationNumber || 'N/A',
        [t('dashboard.export.headers.user')]: r.userName,
        [t('dashboard.export.headers.email')]: r.userEmail || '—',
        [t('dashboard.export.headers.phone')]: r.userPhone,
        [t('dashboard.export.headers.venue')]: r.venueName,
        [t('dashboard.export.headers.date')]: r.date,
        [t('dashboard.export.headers.time')]: r.time,
        [t('dashboard.export.headers.tier')]: r.tierTitle || '—',
        [t('dashboard.export.headers.price')]: r.tierPrice || 0,
        [t('dashboard.export.headers.status')]: STATUS_MAP[r.status] || r.status,
        [t('dashboard.export.headers.notes')]: r.description || '',
        [t('dashboard.export.headers.createdAt')]: r.createdAt ? new Date(r.createdAt).toLocaleString(i18n.language === 'az' ? 'az-AZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US') : '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);

      // Column widths
      ws['!cols'] = [
        { wch: 5 },   // №
        { wch: 18 },  // Kod
        { wch: 22 },  // Ad
        { wch: 26 },  // Email
        { wch: 18 },  // Tel
        { wch: 22 },  // Məkan
        { wch: 14 },  // Tarix
        { wch: 10 },  // Saat
        { wch: 18 },  // Tier
        { wch: 14 },  // Qiymət
        { wch: 14 },  // Status
        { wch: 30 },  // Qeydlər
        { wch: 22 },  // Yaradılma
      ];

      const wb = XLSX.utils.book_new();
      const periodLabel = t(`dashboard.periods.${selectedPeriod}.label`, selectedPeriod);
      XLSX.utils.book_append_sheet(wb, ws, t('dashboard.export.sheetName', { period: periodLabel }));

      const fileName = t('dashboard.export.fileName', { 
        period: periodLabel, 
        date: new Date().toISOString().slice(0, 10) 
      });
      XLSX.writeFile(wb, fileName);

      toast.success(t('dashboard.export.success', { count: result.length }));
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      toast.error(t('dashboard.export.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-error">
        {t('dashboard.export.loadError')}
      </div>
    );
  }

  const {
    totalVenues = 0,
    pendingReservations = 0,
    acceptedReservations = 0,
    rejectedReservations = 0,
    statusStats = { pending: 0, accepted: 0, rejected: 0, total: 1 },
    activityData = [],
    recentBookings = [],
  } = data || {};

  // For the activity chart max value
  const maxActivity = Math.max(...activityData.map((d) => d.count), 1); // fallback to 1 to avoid / 0

  return (
    <>
      <style>{`
        .cloud-shadow { box-shadow: 0px 20px 40px rgba(25, 28, 31, 0.06); }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-card { animation: slideUp 0.6s ease-out both; }
        .anim-delay-1 { animation-delay: 0.1s; }
        .anim-delay-2 { animation-delay: 0.2s; }
        .anim-delay-3 { animation-delay: 0.3s; }
        .anim-delay-4 { animation-delay: 0.4s; }
        .anim-delay-5 { animation-delay: 0.5s; }
        .anim-delay-6 { animation-delay: 0.6s; }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-enter { animation: modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>

      <div className="px-8 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-[2.5rem] font-extrabold tracking-tight text-on-surface dark:text-white leading-tight font-headline">
              {t('dashboard.title')}
            </h1>
            <p className="text-on-surface-variant dark:text-slate-400 font-medium mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2.5 bg-gradient-to-br from-emerald-600 to-teal-500 text-white px-6 py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-200/50"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            {t('dashboard.exportReport')}
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Venues */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 dark:border-slate-800 border border-transparent p-6 rounded-[1.5rem] cloud-shadow relative overflow-hidden group anim-card anim-delay-1">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-primary/5 rounded-xl text-primary">
                <span className="material-symbols-outlined">storefront</span>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-on-surface-variant dark:text-slate-400 mb-1">{t('dashboard.stats.venues')}</p>
              <p className="text-3xl font-extrabold text-on-surface dark:text-white">{totalVenues}</p>
            </div>
          </div>

          {/* Pending Bookings */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 dark:border-slate-800 border border-transparent p-6 rounded-[1.5rem] cloud-shadow relative overflow-hidden group anim-card anim-delay-2">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600">
                <span className="material-symbols-outlined">hourglass_empty</span>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-on-surface-variant dark:text-slate-400 mb-1">{t('dashboard.stats.pending')}</p>
              <p className="text-3xl font-extrabold text-on-surface dark:text-white">{pendingReservations}</p>
            </div>
          </div>

          {/* Accepted Bookings */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 dark:border-slate-800 border border-transparent p-6 rounded-[1.5rem] cloud-shadow relative overflow-hidden group anim-card anim-delay-3">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-green-100 rounded-xl text-green-600">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-on-surface-variant dark:text-slate-400 mb-1">{t('dashboard.stats.accepted')}</p>
              <p className="text-3xl font-extrabold text-on-surface dark:text-white">{acceptedReservations}</p>
            </div>
          </div>

          {/* Rejected Bookings */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 dark:border-slate-800 border border-transparent p-6 rounded-[1.5rem] cloud-shadow relative overflow-hidden group anim-card anim-delay-4">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-red-100 rounded-xl text-red-600">
                <span className="material-symbols-outlined">cancel</span>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-on-surface-variant dark:text-slate-400 mb-1">{t('dashboard.stats.rejected')}</p>
              <p className="text-3xl font-extrabold text-on-surface dark:text-white">{rejectedReservations}</p>
            </div>
          </div>
        </div>

        {/* Charts and Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Reservation Activity (Bar Chart) */}
          <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-slate-900 dark:border-slate-800 border border-transparent p-8 rounded-[1.5rem] cloud-shadow anim-card anim-delay-5">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight font-headline dark:text-white">{t('dashboard.charts.activityTitle')}</h2>
                <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('dashboard.charts.activitySubtitle')}</p>
              </div>
            </div>
            {activityData.length > 0 && activityData.some(d => d.count > 0) ? (
              <div className="flex">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-[300px] pr-3 text-[10px] font-bold text-on-surface-variant/50 dark:text-slate-500/50 tabular-nums">
                  <span>{maxActivity}</span>
                  <span>{Math.round(maxActivity * 0.75)}</span>
                  <span>{Math.round(maxActivity * 0.5)}</span>
                  <span>{Math.round(maxActivity * 0.25)}</span>
                  <span>0</span>
                </div>
                {/* Chart area */}
                <div className="flex-1">
                  <div className="h-[300px] relative">
                    {/* Horizontal grid lines */}
                    {[0, 25, 50, 75, 100].map((pct) => (
                      <div
                        key={pct}
                        className="absolute left-0 right-0 border-t border-outline-variant/15"
                        style={{ bottom: `${pct}%` }}
                      />
                    ))}
                    {/* Bars */}
                    <div className="absolute inset-0 flex items-end gap-3 px-1">
                      {activityData.map((item, index) => {
                        const heightPercent = Math.max((item.count / maxActivity) * 100, 4);
                        const colors = [
                          'linear-gradient(180deg, #6366f1 0%, #a5b4fc 100%)', // Indigo
                          'linear-gradient(180deg, #0ea5e9 0%, #7dd3fc 100%)', // Sky
                          'linear-gradient(180deg, #10b981 0%, #6ee7b7 100%)', // Emerald
                          'linear-gradient(180deg, #f59e0b 0%, #fbbf24 100%)', // Amber
                          'linear-gradient(180deg, #ef4444 0%, #fca5a5 100%)', // Red
                          'linear-gradient(180deg, #8b5cf6 0%, #ddd6fe 100%)', // Violet
                          'linear-gradient(180deg, #ec4899 0%, #f9a8d4 100%)', // Pink
                        ];
                        const barColor = colors[index % colors.length];
                        
                        return (
                          <div
                            key={index}
                            className="flex-1 h-full flex flex-col items-center justify-end group relative z-10"
                          >
                            {/* Number label */}
                            <div 
                              className="text-center mb-2 text-[11px] font-black text-on-surface dark:text-white transition-all duration-300 group-hover:-translate-y-1"
                              style={{ transform: `translateY(-${heightPercent}%)` }}
                            >
                              {item.count}
                            </div>
                            {/* The Bar */}
                            <div
                              className="w-full rounded-t-xl transition-all duration-700 ease-out cursor-pointer hover:brightness-110 shadow-[0_4px_12px_rgba(0,0,0,0.1)] relative overflow-hidden"
                              style={{ 
                                height: `${heightPercent}%`,
                                background: barColor,
                              }}
                            >
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* X-axis labels */}
                  <div className="flex w-full mt-4 text-[10px] font-bold text-on-surface-variant dark:text-slate-500 tracking-widest uppercase opacity-50 px-1">
                    {activityData.map((item, index) => (
                      <div key={index} className="flex-1 text-center truncate px-1">
                        {item.date}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-on-surface-variant dark:text-slate-500 text-sm">
                <div className="text-center">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">bar_chart</span>
                  <p>{t('dashboard.charts.noActivity')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bookings by Status (Donut) */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 dark:border-slate-800 border border-transparent p-8 rounded-[1.5rem] cloud-shadow anim-card anim-delay-5 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight mb-2 font-headline dark:text-white">{t('dashboard.charts.statusTitle')}</h2>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 mb-8">{t('dashboard.charts.statusSubtitle')}</p>
            </div>
            
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#eceef2" strokeWidth="4" />
                {/* Pending Arc (Yellow) */}
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.9"
                  stroke="#fbbf24" // Yellow
                  strokeDasharray={`${(statusStats.pending / statusStats.total) * 100} 100`}
                  strokeWidth="4"
                />
                {/* Accepted Arc (Green) */}
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.9"
                  stroke="#22c55e" // Green
                  strokeDasharray={`${(statusStats.accepted / statusStats.total) * 100} 100`}
                  strokeDashoffset={`-${(statusStats.pending / statusStats.total) * 100}`}
                  strokeWidth="4"
                />
                {/* Rejected Arc (Red) */}
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.9"
                  stroke="#ef4444" // Red
                  strokeDasharray={`${(statusStats.rejected / statusStats.total) * 100} 100`}
                  strokeDashoffset={`-${((statusStats.pending + statusStats.accepted) / statusStats.total) * 100}`}
                  strokeWidth="4"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black dark:text-white">{statusStats.total}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500">{t('dashboard.charts.total')}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span className="text-sm font-medium dark:text-slate-300">{t('common.status.pending')}</span>
                </div>
                <span className="text-sm font-bold dark:text-white">
                  {Math.round((statusStats.pending / statusStats.total) * 100) || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium dark:text-slate-300">{t('common.status.accepted')}</span>
                </div>
                <span className="text-sm font-bold dark:text-white">
                  {Math.round((statusStats.accepted / statusStats.total) * 100) || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium dark:text-slate-300">{t('common.status.canceled')}</span>
                </div>
                <span className="text-sm font-bold dark:text-white">
                  {Math.round((statusStats.rejected / statusStats.total) * 100) || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="lg:col-span-3 bg-surface-container-lowest dark:bg-slate-900/50 dark:border-slate-800 border border-transparent p-8 rounded-[1.5rem] cloud-shadow overflow-hidden anim-card anim-delay-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight font-headline dark:text-white">{t('dashboard.recent.title')}</h2>
                <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('dashboard.recent.subtitle')}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-outline-variant/10 dark:border-slate-800">
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500">{t('dashboard.table.user')}</th>
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500">{t('dashboard.table.venue')}</th>
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500">{t('dashboard.table.dateTime')}</th>
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500">{t('dashboard.table.amount')}</th>
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500">{t('dashboard.table.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-on-surface-variant text-sm">
                        {t('dashboard.recent.noBookings')}
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-surface-container-low/50 transition-colors group">
                        <td className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-slate-800 flex items-center justify-center font-bold text-xs uppercase text-primary">
                              {booking.userName?.substring(0, 2) || 'US'}
                            </div>
                            <span className="text-sm font-bold dark:text-white">{booking.userName || t('dashboard.recent.unknownUser')}</span>
                          </div>
                        </td>
                        <td className="py-5 text-sm font-medium dark:text-slate-300">{booking.venueName}</td>
                        <td className="py-5 text-sm text-on-surface-variant dark:text-slate-400">
                          {booking.date}, {booking.time}
                        </td>
                        <td className="py-5 text-sm font-bold dark:text-white">{booking.price} AZN</td>
                        <td className="py-5">
                          {booking.status === 'pending' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                              {t('common.status.pending')}
                            </span>
                          )}
                          {booking.status === 'accepted' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              {t('common.status.accepted')}
                            </span>
                          )}
                          {(booking.status === 'rejected' || booking.status === 'canceled') && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              {t('common.status.canceled')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <section className="relative w-full max-w-lg bg-surface-container-lowest dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden modal-enter border border-transparent dark:border-slate-800">
            {/* Modal Header */}
            <header className="flex justify-between items-center px-8 py-6 border-b border-outline-variant/10 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined">summarize</span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-on-surface dark:text-white">{t('dashboard.export.modalTitle')}</h2>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">{t('dashboard.export.modalSubtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors text-on-surface-variant dark:text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            {/* Period Selection */}
            <div className="px-8 py-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500 mb-3">
                  {t('dashboard.export.selectPeriod')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PERIODS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setSelectedPeriod(p.key)}
                      className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group ${
                        selectedPeriod === p.key
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-100 dark:shadow-none'
                          : 'border-outline-variant/20 dark:border-slate-700 bg-surface-container-low dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[22px] ${
                          selectedPeriod === p.key ? 'text-emerald-600' : 'text-on-surface-variant'
                        }`}>
                          {p.icon}
                        </span>
                        <div>
                          <span className={`block text-base font-extrabold ${
                            selectedPeriod === p.key ? 'text-emerald-700 dark:text-emerald-400' : 'text-on-surface dark:text-white'
                          }`}>
                            {t(p.labelKey)}
                          </span>
                          <span className="block text-[11px] font-medium text-on-surface-variant dark:text-slate-400">{t(p.descKey)}</span>
                        </div>
                      </div>
                      {selectedPeriod === p.key && (
                        <div className="absolute top-3 right-3">
                          <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-surface-container-low dark:bg-slate-800 p-4 rounded-2xl border border-outline-variant/10 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 text-[20px] mt-0.5">info</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface dark:text-white mb-1">{t('dashboard.export.excelIncludes')}</p>
                    <p className="text-[11px] text-on-surface-variant dark:text-slate-400 leading-relaxed">
                      {t('dashboard.export.excelIncludesDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <footer className="px-8 py-5 bg-surface-container-low dark:bg-slate-800 border-t border-outline-variant/10 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3.5 px-6 rounded-xl text-on-surface dark:text-slate-300 font-bold bg-outline-variant/10 dark:bg-slate-700 hover:bg-outline-variant/20 dark:hover:bg-slate-600 active:scale-95 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 py-3.5 px-6 rounded-xl text-white font-bold bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-200/50 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    {t('dashboard.export.download')}
                  </>
                )}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
};

export default Dashboard;

