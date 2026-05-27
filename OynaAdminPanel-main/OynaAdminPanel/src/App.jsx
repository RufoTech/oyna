import React, { lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setCredentials, logout } from './store/slices/authSlice';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load pages for huge initial bundle reduction
const Login = lazy(() => import('./pages/Login'));
const SuperAdminLogin = lazy(() => import('./pages/SuperAdminLogin'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bookings = lazy(() => import('./pages/Bookings'));
const AddVenue = lazy(() => import('./pages/AddVenue'));
const Venues = lazy(() => import('./pages/Venues'));
const MediaPricing = lazy(() => import('./pages/MediaPricing'));
const CalendarAvailability = lazy(() => import('./pages/CalendarAvailability'));
const EditVenue = lazy(() => import('./pages/EditVenue'));
const AddSpecs = lazy(() => import('./pages/AddSpecs'));
const Simulation = lazy(() => import('./pages/Simulation'));
const Food = lazy(() => import('./pages/Food'));
const AddFood = lazy(() => import('./pages/AddFood'));
const EditFood = lazy(() => import('./pages/EditFood'));
const Help = lazy(() => import('./pages/Help'));

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth.user);

  // Initialize theme on mount
  React.useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleLogin = (loginData) => {
    dispatch(setCredentials(loginData));
    toast.success(t('toast.loginSuccess') || 'Giriş uğurla tamamlandı');
    
    // Redirect based on role
    if (loginData.user.role === 'SUPER_ADMIN') {
      navigate('/superadmin');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    dispatch(logout());
    toast.success(t('toast.logoutSuccess') || 'Çıxış edildi');
    navigate(isSuperAdmin ? '/superadmin/login' : '/login');
  };

  const lazyFallback = (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
      <span className="material-symbols-outlined animate-spin text-4xl text-[#0058bc]">progress_activity</span>
    </div>
  );

  return (
    <ErrorBoundary>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense fallback={lazyFallback}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login onLogin={handleLogin} onSwitchToSuperAdmin={() => navigate('/superadmin/login')} />} />
          <Route path="/superadmin/login" element={<SuperAdminLogin onLogin={handleLogin} onSwitchToAdmin={() => navigate('/login')} />} />

          {/* Super Admin Routes */}
          <Route 
            path="/superadmin" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdmin user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Regular Admin Routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <Suspense fallback={lazyFallback}>
                    <Routes>
                      <Route path="/" element={<Dashboard user={user} onLogout={handleLogout} onNavigate={(page, id) => navigate(id ? `/${page}/${id}` : `/${page}`)} />} />
                      <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} onNavigate={(page, id) => navigate(id ? `/${page}/${id}` : `/${page}`)} />} />
                      <Route path="/venues" element={<Venues onNavigate={(page, id) => navigate(id ? `/${page}/${id}` : `/${page}`)} />} />
                      <Route path="/addVenue/:id?" element={<AddVenue onNavigate={(page, id) => navigate(id ? `/${page}/${id}` : `/${page}`)} />} />
                      <Route path="/editVenue/:id" element={<EditVenueWrapper navigate={navigate} />} />
                      <Route path="/mediaPricing/:id?" element={<MediaPricing onNavigate={(page, id) => navigate(id ? `/${page}/${id}` : `/${page}`)} />} />
                      <Route path="/calendarAvailability/:id?" element={<CalendarAvailability onNavigate={(page, id) => navigate(id ? `/${page}/${id}` : `/${page}`)} />} />
                      <Route path="/addSpecs/:id?" element={<AddSpecs onNavigate={(page, id) => navigate(id ? `/${page}/${id}` : `/${page}`)} />} />
                      <Route path="/simulation" element={<Simulation />} />
                      <Route path="/food" element={<Food onNavigate={(page, id) => navigate(id ? `/${page}/${id}` : `/${page}`)} />} />
                      <Route path="/addFood/:id?" element={<AddFood onNavigate={(page, id) => navigate(id ? `/${page}/${id}` : `/${page}`)} />} />
                      <Route path="/editFood/:id" element={<EditFoodWrapper navigate={navigate} />} />
                      <Route path="/bookings" element={<Bookings />} />
                      <Route path="/help" element={<Help />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

// Helper wrappers to extract params
import { useParams } from 'react-router-dom';

function EditVenueWrapper({ navigate }) {
  const { id } = useParams();
  return <EditVenue onNavigate={(page, tid) => navigate(tid ? `/${page}/${tid}` : `/${page}`)} editingVenueId={id} />;
}

function EditFoodWrapper({ navigate }) {
  const { id } = useParams();
  return <EditFood onNavigate={(page, tid) => navigate(tid ? `/${page}/${tid}` : `/${page}`)} editingFoodId={id} />;
}

export default App;
