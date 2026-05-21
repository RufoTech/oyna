import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useLoginSuperAdminMutation } from '../store/api/authApi';

const SuperAdminLogin = ({ onLogin, onSwitchToAdmin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuperAdmin, { isLoading }] = useLoginSuperAdminMutation();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error('Butun xanalari doldurun.');
      return;
    }

    try {
      const data = await loginSuperAdmin({ email, password }).unwrap();
      onLogin(data);
    } catch (error) {
      toast.error(error?.data?.message || 'Super admin girisi ugursuz oldu.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#f5f7fb] dark:bg-slate-950 transition-colors duration-300">
      <div className="absolute top-[-8%] right-[-2%] w-[420px] h-[420px] rounded-full bg-amber-200/40 blur-[110px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[360px] h-[360px] rounded-full bg-sky-200/40 blur-[110px] pointer-events-none"></div>

      <div className="w-full max-w-[460px] z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 mb-6 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-4xl">shield_person</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface dark:text-white mb-2">Super Admin</h1>
          <p className="text-on-surface-variant dark:text-slate-400 font-medium">Admin qeydiyyati ve idareetme paneli</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[1.75rem] p-10 shadow-[0_24px_60px_rgba(15,23,42,0.08)] border border-slate-200/70 dark:border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500 ml-1" htmlFor="super-admin-email">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">alternate_email</span>
                <input
                  id="super-admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="superadmin@oyna.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low dark:bg-slate-800 border-none rounded-xl text-on-surface dark:text-white placeholder:text-outline focus:ring-2 focus:ring-amber-400/40 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500 ml-1" htmlFor="super-admin-password">Sifre</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  id="super-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low dark:bg-slate-800 border-none rounded-xl text-on-surface dark:text-white placeholder:text-outline focus:ring-2 focus:ring-amber-400/40 outline-none"
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-95 disabled:opacity-70"
            >
              {isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <span>Daxil Ol</span>}
            </button>
          </form>

          <button onClick={onSwitchToAdmin} className="w-full mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">
            Admin login sehifesine kec
          </button>
        </div>
      </div>
    </main>
  );
};

export default SuperAdminLogin;
