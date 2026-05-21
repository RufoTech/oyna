import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useLoginAdminMutation } from '../store/api/authApi';

const Login = ({ onLogin, onSwitchToSuperAdmin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAdmin, { isLoading }] = useLoginAdminMutation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error('Zehmet olmasa butun xanalari doldurun');
      return;
    }

    try {
      const data = await loginAdmin({ email, password }).unwrap();
      onLogin(data);
    } catch (error) {
      toast.error(error?.data?.message || 'Giris zamani xeta bas verdi');
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center px-4 py-12 relative w-full min-h-screen overflow-hidden bg-white dark:bg-slate-950">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-secondary-container/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-primary-container/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 mb-6 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface dark:text-white mb-2">Oyna Admin</h1>
          <p className="text-on-surface-variant dark:text-slate-400 font-medium">Muessise idareetme portalı</p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] p-10 cloud-shadow border border-outline-variant/10 dark:border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500 ml-1" htmlFor="identity">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">alternate_email</span>
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low dark:bg-slate-800 border-none rounded-xl text-on-surface dark:text-white placeholder:text-outline focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest dark:focus:bg-slate-900 transition-all duration-200 outline-none"
                  id="identity"
                  placeholder="admin@oyna.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500 ml-1" htmlFor="password">Sifre</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low dark:bg-slate-800 border-none rounded-xl text-on-surface dark:text-white placeholder:text-outline focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest dark:focus:bg-slate-900 transition-all duration-200 outline-none"
                  id="password"
                  placeholder="••••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface dark:hover:text-white transition-colors" type="button" onClick={() => setShowPassword((prev) => !prev)}>
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                className={`w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl cloud-shadow hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>
                  <span>Giris Et</span>
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>}
              </button>
            </div>
          </form>

          <button onClick={onSwitchToSuperAdmin} className="w-full mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">
            Super admin login sehifesine kec
          </button>
        </div>
      </div>
    </main>
  );
};

export default Login;
