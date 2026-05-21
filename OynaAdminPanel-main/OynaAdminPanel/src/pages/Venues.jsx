import React, { useState } from 'react';
import { useGetVenuesQuery, useDeleteVenueMutation, useUpdateVenueMutation, useGetBlockedUsersQuery, useBlockUserForVenueMutation } from '../store/api/venuesApi';
import { useDispatch } from 'react-redux';
import { resetVenueForm } from '../store/slices/venueFormSlice';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { formatImageUrl } from '../utils/imageUrl';

const BlockedUsersModal = ({ venue, onClose }) => {
  const { t } = useTranslation();
  const { data: blockedUsers, isLoading } = useGetBlockedUsersQuery(venue._id);
  const [unblockUser] = useBlockUserForVenueMutation();

  const handleUnblock = async (email) => {
    if (window.confirm(t('venues.modals.blockedUsers.unblockConfirm', 'Bu istifadəçinin məkanınız üçün olan blokunu açmaq istədiyinizə əminsiniz?'))) {
      try {
        await unblockUser({ venueId: venue._id, email, action: 'unblock' }).unwrap();
        toast.success(t('venues.toast.userUnblocked', 'İstifadəçi bloku açıldı.'));
      } catch (err) {
        toast.error(t('venues.toast.error', 'Xəta baş verdi.'));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-5 border border-transparent dark:border-slate-800 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 dark:text-red-500">block</span>
            </div>
            <h2 className="text-lg font-bold text-on-surface dark:text-white font-headline">{t('venues.modals.blockedUsers.title', 'Bloklanmış İstifadəçilər')}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {isLoading ? (
            <div className="py-10 flex justify-center"><span className="material-symbols-outlined animate-spin text-primary">progress_activity</span></div>
          ) : !blockedUsers || blockedUsers.length === 0 ? (
            <p className="text-center py-10 text-on-surface-variant text-sm">{t('venues.modals.blockedUsers.empty', 'Bloklanmış istifadəçi yoxdur.')}</p>
          ) : (
            blockedUsers.map(email => (
              <div key={email} className="flex justify-between items-center p-3 rounded-xl border border-surface-container-highest dark:border-slate-800">
                <span className="text-sm font-medium text-on-surface dark:text-white">{email}</span>
                <button onClick={() => handleUnblock(email)} className="text-xs px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-red-50 hover:text-red-600 font-bold transition-colors">
                  {t('venues.modals.blockedUsers.unblockBtn', 'Bloku aç')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const Venues = ({ onNavigate }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { data: venues, isLoading, isError } = useGetVenuesQuery();
  const [deleteVenue] = useDeleteVenueMutation();
  const [updateVenue] = useUpdateVenueMutation();

  const [tempCloseModal, setTempCloseModal] = useState(null);
  const [reopenModal, setReopenModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [blockedModal, setBlockedModal] = useState(null);

  const handleDelete = async () => {
    if (!deleteModal) return;

    try {
      await deleteVenue(deleteModal._id).unwrap();
      toast.success(t('venues.toast.deleted'));
    } catch {
      toast.error(t('venues.toast.deleteError'));
    } finally {
      setDeleteModal(null);
    }
  };

  const handleAddNew = () => {
    dispatch(resetVenueForm());
    onNavigate('addVenue');
  };

  const handleReservationToggle = async (venue) => {
    if (venue.temporarilyClosed) {
      toast.warning(t('venues.toast.alreadyTempClosed'));
      return;
    }

    const nextStatus = venue.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await updateVenue({ id: venue._id, status: nextStatus }).unwrap();
    } catch {
      toast.error(t('venues.toast.statusChangeError'));
    }
  };

  const handleConfirmTempClose = async () => {
    if (!tempCloseModal) return;

    try {
      await updateVenue({
        id: tempCloseModal._id,
        temporarilyClosed: true,
        status: 'INACTIVE',
      }).unwrap();
      toast.info(t('venues.toast.tempClosedSuccess', { name: tempCloseModal.name }));
    } catch {
      toast.error(t('venues.toast.operationFailed'));
    } finally {
      setTempCloseModal(null);
    }
  };

  const handleConfirmReopen = async () => {
    if (!reopenModal) return;

    try {
      await updateVenue({
        id: reopenModal._id,
        temporarilyClosed: false,
        status: 'ACTIVE',
      }).unwrap();
      toast.success(t('venues.toast.reopenedSuccess', { name: reopenModal.name }));
    } catch {
      toast.error(t('venues.toast.operationFailed'));
    } finally {
      setReopenModal(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  if (isError) {
    return <div className="p-8 text-error">{t('venues.errorLoading')}</div>;
  }

  return (
    <>
      <style>{`
        .font-headline { font-family: 'Manrope', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
        .cloud-shadow { box-shadow: 0px 20px 40px rgba(25, 28, 31, 0.06); }
      `}</style>

      {tempCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-5 border border-transparent dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-500">warning</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface dark:text-white font-headline">{t('venues.modals.tempClose.title')}</h2>
            </div>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
              {t('venues.modals.tempClose.desc', { name: tempCloseModal.name })}
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setTempCloseModal(null)} className="flex-1 py-2.5 rounded-xl border border-surface-container-highest dark:border-slate-700 text-sm font-semibold text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-all cursor-pointer">
                {t('venues.modals.cancel')}
              </button>
              <button onClick={handleConfirmTempClose} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all cursor-pointer">
                {t('venues.modals.tempClose.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {reopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-5 border border-transparent dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 dark:text-green-500">lock_open</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface dark:text-white font-headline">{t('venues.modals.reopen.title')}</h2>
            </div>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
              {t('venues.modals.reopen.desc', { name: reopenModal.name })}
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setReopenModal(null)} className="flex-1 py-2.5 rounded-xl border border-surface-container-highest dark:border-slate-700 text-sm font-semibold text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-all cursor-pointer">
                {t('venues.modals.cancel')}
              </button>
              <button onClick={handleConfirmReopen} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all cursor-pointer">
                {t('venues.modals.reopen.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-5 border border-transparent dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 dark:text-red-500">delete</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface dark:text-white font-headline">{t('venues.modals.delete.title')}</h2>
            </div>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
              {t('venues.modals.delete.desc', { name: deleteModal.name })}
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 rounded-xl border border-surface-container-highest dark:border-slate-700 text-sm font-semibold text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-all cursor-pointer">
                {t('venues.modals.cancel')}
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all cursor-pointer">
                {t('venues.modals.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {blockedModal && (
        <BlockedUsersModal venue={blockedModal} onClose={() => setBlockedModal(null)} />
      )}

      <div className="p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface dark:text-white">{t('venues.title')}</h1>
            <p className="text-on-surface-variant dark:text-slate-400 text-sm">{t('venues.subtitle')}</p>
          </div>
          {(!venues || venues.length === 0) && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined">add_circle</span>
              {t('venues.addNew')}
            </button>
          )}
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl cloud-shadow overflow-hidden border border-transparent dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 dark:bg-slate-800/50">
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant dark:text-slate-500">{t('venues.table.name')}</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant dark:text-slate-500">{t('venues.table.category')}</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant dark:text-slate-500">{t('venues.table.location')}</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant dark:text-slate-500">{t('venues.table.phone')}</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant dark:text-slate-500">{t('venues.table.resStatus')}</th>
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant dark:text-slate-500 text-right">{t('venues.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {venues && venues.length > 0 ? (
                  venues.map((venue) => {
                    const heroImage = venue.media?.heroImage?.[0] || venue.media?.heroImage || 'https://placehold.co/100x100?text=No+Image';
                    const isReservationActive = venue.status === 'ACTIVE' && !venue.temporarilyClosed;
                    const isTempClosed = venue.temporarilyClosed;

                    let bgCol = 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
                    if (venue.category === 'Playstation Club') bgCol = 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
                    if (venue.category === 'Karaoke') bgCol = 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';

                    return (
                      <tr key={venue._id} className="group hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-surface-container overflow-hidden">
                              <img className="w-full h-full object-cover" alt={venue.name} src={formatImageUrl(heroImage)} />
                            </div>
                            <div>
                              <div className="font-bold text-on-surface dark:text-white">{venue.name}</div>
                              <div className="text-xs text-on-surface-variant dark:text-slate-400">ID: {venue._id.substring(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`px-3 py-1 ${bgCol} text-xs font-semibold rounded-full`}>{venue.category}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="text-sm text-on-surface dark:text-slate-200">{venue.location?.city || t('venues.table.unknown')}</div>
                          <div className="text-xs text-on-surface-variant dark:text-slate-400">{venue.location?.address || '-'}</div>
                        </td>
                        <td className="px-6 py-6 text-sm font-medium text-on-surface dark:text-white">{venue.contact?.phone || '-'}</td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReservationToggle(venue)}
                                className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors cursor-pointer ${
                                  isReservationActive ? 'bg-primary' : 'bg-surface-container-highest'
                                }`}
                              >
                                <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                  isReservationActive ? 'translate-x-4' : 'translate-x-0.5'
                                }`} />
                              </button>
                              <span className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                isReservationActive ? 'text-primary' : 'text-on-surface-variant/60'
                              }`}>
                                {isReservationActive ? t('venues.table.accepting') : t('venues.table.notAccepting')}
                              </span>
                            </div>

                            {isTempClosed ? (
                              <button
                                onClick={() => setReopenModal(venue)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-wide hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">lock</span>
                                {t('venues.table.tempClosed')}
                              </button>
                            ) : (
                              <button
                                onClick={() => setTempCloseModal(venue)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 text-[11px] font-bold uppercase tracking-wide hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-500 dark:hover:text-orange-400 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">lock_open</span>
                                {t('venues.table.closeTemp')}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setBlockedModal(venue)} className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Bloklanmış İstifadəçilər">
                              <span className="material-symbols-outlined text-xl">block</span>
                            </button>
                            <button onClick={() => onNavigate('editVenue', venue._id)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Edit">
                              <span className="material-symbols-outlined text-xl">edit_note</span>
                            </button>
                            <button onClick={() => setDeleteModal(venue)} className="p-2 text-on-surface-variant dark:text-slate-500 hover:text-error hover:bg-error/5 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete">
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-10 text-center text-on-surface-variant">{t('venues.table.noData')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Venues;
