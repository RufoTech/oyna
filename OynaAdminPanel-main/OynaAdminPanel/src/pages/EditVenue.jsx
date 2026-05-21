import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadVenueForEdit } from '../store/slices/venueFormSlice';
import { useGetVenueByIdQuery } from '../store/api/venuesApi';
import { toast } from 'react-toastify';

const EditVenue = ({ onNavigate, editingVenueId }) => {
  const dispatch = useDispatch();
  const { data: venue, isError } = useGetVenueByIdQuery(editingVenueId, {
    skip: !editingVenueId,
  });

  useEffect(() => {
    if (!editingVenueId) {
      toast.error('Redaktə etmək üçün məkan tapılmadı.');
      onNavigate('venues');
      return;
    }

    if (venue) {
      // Dispatch venue data to Redux state
      dispatch(loadVenueForEdit(venue));
      // Route immediately to AddVenue where the form is correctly filled!
      onNavigate('addVenue', editingVenueId);
    }

    if (isError) {
      toast.error('Məkan məlumatları yüklənərkən xəta baş verdi.');
      onNavigate('venues');
    }
  }, [venue, isError, editingVenueId, dispatch, onNavigate]);

  return (
    <div className="p-8 h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
      <span className="material-symbols-outlined animate-spin text-primary text-6xl mb-4">progress_activity</span>
      <h2 className="text-2xl font-bold font-headline mb-2 text-on-surface dark:text-white">Məlumatlar Yüklənir...</h2>
      <p className="text-on-surface-variant dark:text-slate-400">Məkan redaktəyə hazırlanır.</p>
    </div>
  );
};

export default EditVenue;
