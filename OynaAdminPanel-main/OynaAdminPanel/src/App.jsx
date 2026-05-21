import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setCredentials, logout } from './store/slices/authSlice';
import Login from './pages/Login';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdmin from './pages/SuperAdmin';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import AddVenue from './pages/AddVenue';
import Venues from './pages/Venues';
import MediaPricing from './pages/MediaPricing';
import CalendarAvailability from './pages/CalendarAvailability';
import EditVenue from './pages/EditVenue';
import AddSpecs from './pages/AddSpecs';
import Simulation from './pages/Simulation';
import Food from './pages/Food';
import AddFood from './pages/AddFood';
import EditFood from './pages/EditFood';
import Help from './pages/Help';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
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
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
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
