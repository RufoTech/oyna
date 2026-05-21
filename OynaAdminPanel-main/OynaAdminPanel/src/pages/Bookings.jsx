import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetReservationsQuery,
  useUpdateReservationStatusMutation,
  useCheckInReservationMutation,
} from '../store/api/reservationsApi';
import { useBlockUserForVenueMutation, useGetBlockedUsersQuery } from '../store/api/venuesApi';
import { dashboardApi, useGetDashboardStatsQuery } from '../store/api/dashboardApi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const Bookings = () => {
  const { t } = useTranslation();
  const [selectedRes, setSelectedRes] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [checkInCode, setCheckInCode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      if (searchQuery) setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch reservations from RTK Query
  const { data: resData = {}, isLoading, error } = useGetReservationsQuery({ page: currentPage, limit: 10, search: debouncedSearch });
  const reservations = resData.reservations || [];
  const pagination = resData.pagination || { totalPages: 1, currentPage: 1 };
  
  const { data: dashboardData } = useGetDashboardStatsQuery();
  
  const [updateStatus, { isLoading: isUpdating }] = useUpdateReservationStatusMutation();
  const [checkInReservation, { isLoading: isCheckingIn }] = useCheckInReservationMutation();
  const [blockUserForVenue] = useBlockUserForVenueMutation();

  const { data: blockedUsers = [] } = useGetBlockedUsersQuery(selectedRes?.venueId, {
    skip: !selectedRes?.venueId,
  });

  const isUserBlocked = selectedRes?.userEmail ? blockedUsers.includes(selectedRes.userEmail) : false;

  const confirmBlockToggle = async () => {
    if (!selectedRes?.userEmail) return;
    const action = isUserBlocked ? 'unblock' : 'block';
    try {
      await blockUserForVenue({
        venueId: selectedRes.venueId,
        email: selectedRes.userEmail,
        action
      }).unwrap();
      toast.success(action === 'block' 
        ? t('bookings.toast.userBlocked', 'İstifadəçi bloklandı.') 
        : t('bookings.toast.userUnblocked', 'İstifadəçi blokdan çıxarıldı.'));
      setIsBlockModalOpen(false);
    } catch (err) {
      toast.error(t('bookings.toast.error'));
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      if (status === 'rejected' && !rejectReason.trim()) {
        toast.error(t('bookings.toast.rejectReasonRequired'));
        return;
      }
      
      await updateStatus({ id, status, rejectReason: status === 'rejected' ? rejectReason : '' }).unwrap();
      
      const statusText = status === 'accepted' ? t('bookings.toast.acceptedStr') : t('bookings.toast.rejectedStr');
      toast.success(t('bookings.toast.statusSuccess', { status: statusText }));
      
      dispatch(dashboardApi.util.invalidateTags(['Dashboard']));
      setSelectedRes(null);
      setRejectMode(false);
      setRejectReason('');
    } catch (err) {
      toast.error(t('bookings.toast.error'));
      console.error(err);
    }
  };

  const handleCheckIn = async () => {
    if (!checkInCode.trim() || !selectedRes) return;
    try {
      await checkInReservation({ 
        reservationNumber: checkInCode.trim(), 
        venueId: selectedRes.venueId 
      }).unwrap();
      
      toast.success(t('bookings.modal.checkInSuccess', 'Check-in uğurlu! İstifadəçi qeydiyyatdan keçdi.'));
      dispatch(dashboardApi.util.invalidateTags(['Dashboard']));
      setSelectedRes(null);
      setCheckInCode('');
    } catch (err) {
      toast.error(err?.data?.message || t('bookings.modal.checkInError', 'Kod yanlışdır və ya rezervasiya tapılmadı.'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-error">
        {t('bookings.toast.loadError')}
      </div>
    );
  }

  // Use backend search results instead of frontend filter
  const filteredReservations = reservations;

  // Calculate summaries based on dashboard stats
  const pendingCount = dashboardData?.pendingReservations || 0;
  const acceptedCount = dashboardData?.acceptedReservations || 0;
  const totalCount = dashboardData?.statusStats?.total || 0;

  const generatePageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };
  const pageNumbers = generatePageNumbers(pagination.currentPage, pagination.totalPages);

  return (
    <>
      <style>{`
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .cloud-shadow {
            box-shadow: 0px 20px 40px rgba(25, 28, 31, 0.06);
        }
      `}</style>
      
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-end gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface dark:text-white">{t('bookings.title')}</h2>
            <p className="text-on-surface-variant dark:text-slate-400 font-medium">{t('bookings.subtitle')}</p>
          </div>
          <button 
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-surface-container-highest dark:bg-slate-800 text-on-surface dark:text-white hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 rounded-2xl font-bold transition-all group active:scale-95 cursor-pointer border border-transparent dark:border-slate-700"
          >
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">search</span>
            <span>{t('bookings.search.title')}</span>
          </button>
        </div>

        {/* Summary Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-6 cloud-shadow relative overflow-hidden group border border-transparent dark:border-slate-800">
            <div className="relative z-10">
              <p className="text-on-surface-variant dark:text-slate-400 font-label text-xs uppercase tracking-widest font-semibold mb-2">{t('bookings.stats.pending')}</p>
              <h3 className="text-4xl font-headline font-extrabold text-on-surface dark:text-white">{pendingCount}</h3>
            </div>
            <div className="absolute -bottom-2 -right-2 opacity-10 transform scale-150 transition-transform duration-500">
              <span className="material-symbols-outlined text-9xl text-secondary">pending_actions</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-6 cloud-shadow relative overflow-hidden group border border-transparent dark:border-slate-800">
            <div className="relative z-10">
              <p className="text-on-surface-variant dark:text-slate-400 font-label text-xs uppercase tracking-widest font-semibold mb-2">{t('bookings.stats.accepted')}</p>
              <h3 className="text-4xl font-headline font-extrabold text-on-surface dark:text-white">{acceptedCount}</h3>
            </div>
            <div className="absolute -bottom-2 -right-2 opacity-10 transform scale-150 transition-transform duration-500">
              <span className="material-symbols-outlined text-9xl text-green-500">check_circle</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-6 cloud-shadow relative overflow-hidden group border border-transparent dark:border-slate-800">
            <div className="relative z-10">
              <p className="text-on-surface-variant dark:text-slate-400 font-label text-xs uppercase tracking-widest font-semibold mb-2">{t('bookings.stats.total')}</p>
              <h3 className="text-4xl font-headline font-extrabold text-on-surface dark:text-white">{totalCount}</h3>
            </div>
            <div className="absolute -bottom-2 -right-2 opacity-10 transform scale-150 transition-transform duration-500">
              <span className="material-symbols-outlined text-9xl text-primary">analytics</span>
            </div>
          </div>
        </div>

        {/* Main Data Table  */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl overflow-hidden cloud-shadow border border-transparent dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 dark:text-slate-500">{t('bookings.table.venue')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 dark:text-slate-500">{t('bookings.table.id')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 dark:text-slate-500">{t('bookings.table.user')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 dark:text-slate-500">{t('bookings.table.dateTime')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 dark:text-slate-500">{t('bookings.table.status')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 dark:text-slate-500 text-right">{t('bookings.table.details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-on-surface-variant">
                      {t('bookings.table.noData')}
                    </td>
                  </tr>
                ) : (
                  reservations.map((r) => (
                    <tr 
                      key={r._id} 
                      onClick={() => setSelectedRes(r)} 
                      className="group hover:bg-surface-container-low dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer border-b border-outline-variant/10 dark:border-slate-800"
                    >
                      <td className="px-6 py-5 text-sm font-bold text-on-surface dark:text-white">{r.venueName}</td>
                      <td className="px-6 py-5 text-sm font-bold text-primary">{r.reservationNumber ?? 'N/A'}</td>
                      <td className="px-6 py-5 text-sm font-medium dark:text-slate-300">{r.userName}</td>
                      <td className="px-6 py-5 text-sm">
                        <div className="flex flex-col">
                          <span className="font-bold dark:text-white">{r.date}</span>
                          <span className="text-xs text-on-surface-variant dark:text-slate-400">{r.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {r.status === 'pending' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{t('common.status.pending')}</span>}
                        {r.status === 'accepted' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{t('common.status.accepted')}</span>}
                        {r.status === 'awaiting_arrival' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{t('common.status.awaiting_arrival', 'Gəliş Gözlənilir')}</span>}
                        {r.status === 'arrived' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{t('common.status.arrived', 'Gəldi')}</span>}
                        {r.status === 'rejected' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{t('common.status.rejected')}</span>}
                        {r.status === 'canceled' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400">{t('common.status.canceled')}</span>}
                        {r.status === 'no_show' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">{t('common.status.no_show', 'Gəlmədi')}</span>}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="material-symbols-outlined text-lg text-on-surface-variant dark:text-slate-400">visibility</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-surface-container-low dark:bg-slate-800/30 border-t border-outline-variant/10 dark:border-slate-800">
              <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">
                {t('bookings.pagination.info', { total: pagination.totalCount, current: pagination.currentPage, pages: pagination.totalPages })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={pagination.currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 dark:border-slate-700 text-on-surface dark:text-slate-300 hover:bg-surface-container-highest dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                
                {pageNumbers.map((num, idx) => (
                  <button
                    key={idx}
                    onClick={() => num !== '...' && setCurrentPage(num)}
                    disabled={num === '...'}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                      num === pagination.currentPage
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : num === '...'
                        ? 'text-on-surface-variant dark:text-slate-500 cursor-default'
                        : 'border border-outline-variant/30 dark:border-slate-700 text-on-surface dark:text-slate-300 hover:bg-surface-container-highest dark:hover:bg-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 dark:border-slate-700 text-on-surface dark:text-slate-300 hover:bg-surface-container-highest dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <section className="relative w-full max-w-2xl bg-surface-container-lowest dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-transparent dark:border-slate-800">
            <header className="flex justify-between items-center px-8 py-6 border-b border-outline-variant/10 dark:border-slate-800">
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface dark:text-white">{t('bookings.modal.title')}</h2>
              <button onClick={() => {
                setSelectedRes(null);
                setRejectMode(false);
                setRejectReason('');
                setCheckInCode('');
              }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors text-on-surface-variant dark:text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
              {/* User Section */}
              <section className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-on-surface dark:text-white">{selectedRes.userName}</h3>
                  <p className="text-on-surface-variant dark:text-slate-400 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    {selectedRes.userEmail || t('bookings.modal.noNote').split(' ')[0]}
                  </p>
                  <p className="text-on-surface-variant dark:text-slate-400 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">call</span>
                    {selectedRes.userPhone}
                  </p>
                </div>
                <button
                  onClick={() => setIsBlockModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                    isUserBlocked 
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isUserBlocked ? 'lock_open' : 'block'}
                  </span>
                  {isUserBlocked 
                    ? t('bookings.modal.unblockUser', 'Blokdan çıxar')
                    : t('bookings.modal.blockUser', 'Blokla')}
                </button>
              </section>

              {/* Booking Info Grid */}
              <section className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.venue')}</span>
                  <p className="text-lg font-bold text-on-surface dark:text-white mt-1">{selectedRes.venueName}</p>
                </div>
                <div className="bg-surface-container-low dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.id')}</span>
                  <p className="text-lg font-bold text-primary mt-1">{selectedRes.reservationNumber ?? 'N/A'}</p>
                </div>
                <div className="bg-surface-container-low dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.date')}</span>
                  <p className="text-lg font-bold text-on-surface dark:text-white mt-1">{selectedRes.date}</p>
                </div>
                <div className="bg-surface-container-low dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.time')}</span>
                  <p className="text-lg font-bold text-on-surface dark:text-white mt-1">{selectedRes.time}</p>
                </div>
              </section>

              {selectedRes.tierTitle && (
                <section className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/10 dark:border-primary/20">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-80">{t('bookings.modal.tier')}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-bold text-on-surface dark:text-white">{selectedRes.tierTitle}</p>
                    <p className="text-lg font-bold text-primary">{selectedRes.tierPrice} AZN</p>
                  </div>
                </section>
              )}

              {selectedRes.description && (
                <section className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.userNote')}</h4>
                  <div className="bg-surface-container-low dark:bg-slate-800/50 p-5 rounded-2xl relative">
                    <span className="material-symbols-outlined absolute top-4 right-4 text-outline-variant opacity-40 text-3xl">format_quote</span>
                    <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed pr-8">
                      {selectedRes.description}
                    </p>
                  </div>
                </section>
              )}

              {(selectedRes.status === 'rejected' || selectedRes.status === 'canceled' || selectedRes.status === 'no_show') && selectedRes.rejectReason && (
                <section className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-error opacity-80">
                    {t('bookings.modal.rejectReasonDesc')}
                  </h4>
                  <div className="bg-error/10 p-5 rounded-2xl relative border border-error/20">
                    <span className="material-symbols-outlined absolute top-4 right-4 text-error opacity-40 text-3xl">warning</span>
                    <p className="text-sm text-error leading-relaxed pr-8 font-medium">
                      {selectedRes.rejectReason}
                    </p>
                  </div>
                </section>
              )}

              {/* Check-In Section for awaiting_arrival */}
              {selectedRes.status === 'awaiting_arrival' && (
                <section className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">directions_walk</span>
                    <div>
                      <h4 className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {t('bookings.modal.checkInTitle', 'İstifadəçi gəldi?')}
                      </h4>
                      <p className="text-sm text-blue-800/70 dark:text-blue-400/70 mt-1">
                        Məkana daxil olduqda istifadəçinin rezervasiya kodunu bura daxil edin və gəlişini təsdiqləyin.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <input 
                      type="text" 
                      placeholder={t('bookings.modal.checkInPlaceholder', 'Rezervasiya kodunu daxil edin')}
                      value={checkInCode}
                      onChange={(e) => setCheckInCode(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                    />
                    <button 
                      onClick={handleCheckIn}
                      disabled={isCheckingIn || !checkInCode.trim()}
                      className="px-6 rounded-xl text-white font-bold bg-blue-600 shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isCheckingIn ? t('common.loading') : t('bookings.modal.checkInBtn', 'Gəlməsini Təsdiqlə')}
                    </button>
                  </div>
                </section>
              )}
            </div>
            
            {/* Actions Footer */}
            {selectedRes.status === 'pending' && !rejectMode && (
              <footer className="px-8 py-6 bg-surface-container-low dark:bg-slate-800 flex gap-4 border-t border-outline-variant/10 dark:border-slate-800">
                <button 
                  onClick={() => handleStatusUpdate(selectedRes._id, 'accepted')}
                  disabled={isUpdating}
                  className="flex-1 py-4 px-6 rounded-xl text-white font-bold bg-gradient-to-br from-green-600 to-green-500 shadow-lg shadow-green-200/20 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isUpdating ? t('common.loading') : t('bookings.modal.acceptBtn')}
                </button>
                <button 
                  onClick={() => setRejectMode(true)}
                  disabled={isUpdating}
                  className="flex-1 py-4 px-6 rounded-xl text-error font-bold bg-white dark:bg-slate-900 border border-error/20 hover:bg-error/5 active:scale-95 transition-all disabled:opacity-50"
                >
                  {t('bookings.modal.rejectBtn')}
                </button>
              </footer>
            )}

            {/* Reject Form Footer */}
            {selectedRes.status === 'pending' && rejectMode && (
              <footer className="px-8 py-6 bg-surface-container-low dark:bg-slate-800 flex flex-col gap-4 border-t border-outline-variant/10 dark:border-slate-800">
                <div className="w-full">
                  <label className="block text-sm font-bold text-on-surface dark:text-white mb-2">{t('bookings.modal.rejectReasonDesc')}</label>
                  <textarea 
                    autoFocus
                    placeholder={t('bookings.modal.rejectPlaceholder')}
                    className="w-full bg-white dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-700 rounded-xl p-4 text-sm text-on-surface dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-error focus:border-error"
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    disabled={isUpdating}
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setRejectMode(false)}
                    disabled={isUpdating}
                    className="flex-1 py-3 px-6 rounded-xl text-on-surface font-bold bg-outline-variant/10 hover:bg-outline-variant/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedRes._id, 'rejected')}
                    disabled={isUpdating || !rejectReason.trim()}
                    className="flex-1 py-3 px-6 rounded-xl text-white font-bold bg-error shadow-lg shadow-error/30 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? t('common.loading') : t('bookings.modal.rejectBtn')}
                  </button>
                </div>
              </footer>
            )}
          </section>
        </div>
      )}

      {/* Block/Unblock Confirmation Modal */}
      {isBlockModalOpen && selectedRes && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-transparent dark:border-slate-800 text-center">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${isUserBlocked ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
              <span className="material-symbols-outlined text-3xl">{isUserBlocked ? 'lock_open' : 'block'}</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface dark:text-white mb-2">
              {isUserBlocked 
                ? t('bookings.modal.unblockTitle', 'İstifadəçini blokdan çıxarmaq istəyirsiniz?') 
                : t('bookings.modal.blockTitle', 'İstifadəçini bloklamaq istəyirsiniz?')}
            </h3>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 mb-8">
              {isUserBlocked
                ? t('bookings.modal.unblockDesc', 'Bu istifadəçi artıq bu məkan üçün rezervasiya edə biləcək.')
                : t('bookings.modal.blockDesc', 'Bu istifadəçi bu məkan üçün bir daha rezervasiya edə bilməyəcək.')}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsBlockModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-highest dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel', 'Ləğv et')}
              </button>
              <button 
                onClick={confirmBlockToggle}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-colors ${
                  isUserBlocked ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isUserBlocked ? t('common.unblock', 'Bəli, çıxar') : t('common.block', 'Bəli, blokla')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <section className="relative w-full max-w-xl bg-surface-container-lowest dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-transparent dark:border-slate-800">
            <header className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10 dark:border-slate-800">
              <h2 className="text-xl font-extrabold tracking-tight text-on-surface dark:text-white">{t('bookings.search.title')}</h2>
              <button onClick={() => {
                setIsSearchModalOpen(false);
                setSearchQuery('');
              }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors text-on-surface-variant dark:text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            
            <div className="p-6 border-b border-outline-variant/10 dark:border-slate-800">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                  autoFocus
                  type="text" 
                  placeholder={t('bookings.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all font-medium text-on-surface dark:text-white outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-container-low/30 dark:bg-slate-800/20">
              {searchQuery.trim() === '' ? (
                <div className="text-center py-10 text-on-surface-variant/60 dark:text-slate-500 font-medium">
                  {t('bookings.search.emptyPrompt')}
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant/60 dark:text-slate-500 font-medium">
                  {t('bookings.table.noData')}
                </div>
              ) : (
                filteredReservations.map((r) => (
                  <div 
                    key={r._id}
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setSearchQuery('');
                      setSelectedRes(r);
                    }}
                    className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border border-outline-variant/10 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div>
                      <h4 className="font-bold text-on-surface dark:text-white">{r.userName}</h4>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">call</span>
                        {r.userPhone}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-primary">{r.reservationNumber}</span>
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-slate-500">{r.date}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-surface-container-low dark:bg-slate-700 flex items-center justify-center text-on-surface-variant dark:text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default Bookings;
