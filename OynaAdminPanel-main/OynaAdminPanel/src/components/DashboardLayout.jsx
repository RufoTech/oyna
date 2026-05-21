import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { reservationsApi } from '../store/api/reservationsApi';
import { dashboardApi } from '../store/api/dashboardApi';
import Sidebar from './Sidebar';
import TopNavBar from './TopNavBar';
import { useTranslation } from 'react-i18next';

const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play();
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const DashboardLayout = ({ user, onLogout, children }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const dispatch = useDispatch();

  // Global Socket.io connection — stays alive across ALL admin pages
  useEffect(() => {
    // Request browser Notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const socket = io(import.meta.env.VITE_API_URL, {
      query: { role: 'admin', adminId: user?._id },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🔌 Global socket connected as Admin');
    });

    socket.on('newReservation', (data) => {
      console.log('New reservation received:', data);
      toast.info(t('notifications.newReservationToast', { venue: data.venueName, user: data.userName }));

      // Play sound
      playNotificationSound();

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(t('notifications.newReservation'), {
          body: t('notifications.newReservationBody', { venue: data.venueName, user: data.userName }),
        });
      }

      // Invalidate RTK Query caches so Bookings list + Dashboard stats auto-refetch
      dispatch(reservationsApi.util.invalidateTags(['Reservation']));
      dispatch(dashboardApi.util.invalidateTags(['Dashboard']));

      // Also trigger "!" pending animation on Simulation if reservation has a tableId
      if (data.tableId) {
        window.dispatchEvent(new CustomEvent('tablePendingReservation', { detail: data }));
      }
    });

    socket.on('reservationCanceled', (data) => {
      console.log('Reservation canceled by user/system:', data);
      
      const reasonMsg = data.status === 'rejected' ? 'avtomatik ləğv edildi (vaxt bitdi)' 
                      : data.status === 'no_show' ? 'avtomatik ləğv edildi (gecikmə)'
                      : 'istifadəçi tərəfindən ləğv edildi';
                      
      toast.error(`❌ "${data.tableName || 'Masa'}" rezervasiyası ${reasonMsg}.`);

      // Invalidate caches to refresh lists
      dispatch(reservationsApi.util.invalidateTags(['Reservation']));
      dispatch(dashboardApi.util.invalidateTags(['Dashboard']));
    });

    socket.on('venueLayoutUpdate', (data) => {
      console.log('Layout update received:', data);
      if (data?.venueId) {
        import('../store/api/venuesApi').then(({ venuesApi }) => {
           dispatch(venuesApi.util.invalidateTags([{ type: 'Layout', id: data.venueId }]));
        });
      }
      // Dispatch custom event for Simulation.jsx to pick up layout changes
      window.dispatchEvent(new CustomEvent('venueLayoutUpdate', { detail: data }));
    });

    socket.on('tablePendingReservation', (data) => {
      console.log('📢 Table pending reservation:', data);
      // Dispatch custom event for Simulation.jsx "!" animation
      window.dispatchEvent(new CustomEvent('tablePendingReservation', { detail: data }));
    });

    socket.on('venueStatusUpdate', (data) => {
      console.log('Venue status update received:', data);
      if (data?._id) {
        import('../store/api/venuesApi').then(({ venuesApi }) => {
           dispatch(venuesApi.util.invalidateTags([{ type: 'Venues', id: data._id }, 'Venues']));
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Global socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch, user, t]);

  return (
    <div className="bg-surface dark:bg-slate-950 text-on-surface dark:text-slate-100 min-h-screen flex transition-colors duration-300">
      <Sidebar user={user} onLogout={onLogout} isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'}`}>
        <TopNavBar isOpen={isOpen} />
        <main className="pt-24 pb-12 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
