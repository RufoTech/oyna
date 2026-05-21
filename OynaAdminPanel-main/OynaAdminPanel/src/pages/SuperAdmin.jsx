import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useCreateAdminMutation,
  useGetAdminsQuery,
  useDeleteAdminMutation,
  useResetPasswordMutation,
} from '../store/api/authApi';

const SuperAdmin = ({ user, onLogout }) => {
  const { data: admins = [], isLoading, isError } = useGetAdminsQuery();
  const [createAdmin, { isLoading: isCreating }] = useCreateAdminMutation();
  const [deleteAdmin] = useDeleteAdminMutation();
  const [resetPassword] = useResetPasswordMutation();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Modals state
  const [deleteModal, setDeleteModal] = useState(null); // stores admin to delete
  const [resetModal, setResetModal] = useState(null); // stores admin to reset
  const [newPass, setNewPass] = useState('');

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    if (!displayName.trim() || !email.trim() || !password.trim()) {
      toast.error('Bütün xanaları doldurun.');
      return;
    }

    try {
      await createAdmin({
        displayName: displayName.trim(),
        email: email.trim(),
        password: password.trim(),
      }).unwrap();

      toast.success('Yeni admin yaradıldı.');
      setDisplayName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      toast.error(error?.data?.message || 'Admin yaradılan zaman xəta baş verdi.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    try {
      await deleteAdmin(deleteModal._id).unwrap();
      toast.success(`"${deleteModal.displayName}" silindi.`);
      setDeleteModal(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Silinmə zamanı xəta baş verdi.');
    }
  };

  const handleResetConfirm = async () => {
    if (!resetModal || !newPass.trim()) return;
    try {
      await resetPassword({ id: resetModal._id, password: newPass.trim() }).unwrap();
      toast.success('Şifrə yeniləndi.');
      setResetModal(null);
      setNewPass('');
    } catch (err) {
      toast.error(err?.data?.message || 'Şifrə sıfırlanarkən xəta baş verdi.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full mx-4 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Admini Sil?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  <span className="font-bold text-slate-700 dark:text-slate-300">"{deleteModal.displayName}"</span> adlı admini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Ləğv et
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-3.5 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all cursor-pointer"
              >
                Bəli, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full mx-4 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">lock_reset</span>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Şifrəni Sıfırla</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  <span className="font-bold text-slate-700">{resetModal.displayName}</span> üçün yeni şifrə təyin edin.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder="Yeni şifrə..."
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-primary/20 font-bold text-on-surface dark:text-white"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => { setResetModal(null); setNewPass(''); }}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Ləğv et
                </button>
                <button 
                  disabled={!newPass.trim()}
                  onClick={handleResetConfirm}
                  className="flex-1 py-3.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:scale-100"
                >
                  Yadda saxla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold mb-3">Super Admin Panel</p>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 font-headline">Adminləri idarə et</h1>
            <p className="text-slate-600 max-w-2xl">Buradan yeni admin qeydiyyatdan keçirə bilər və sistemdəki bütün adminləri idarə edə bilərsiniz.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-500">Daxil olan</p>
              <p className="font-bold text-on-surface dark:text-white">{user?.displayName || 'Super Admin'}</p>
            </div>
            <button onClick={onLogout} className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors cursor-pointer">
              Çıxış et
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-[1.75rem] p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-200/70 dark:border-slate-800">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-2">Yeni Admin</p>
              <h2 className="text-2xl font-extrabold tracking-tight">Admin qeydiyyatı</h2>
            </div>

            <form className="space-y-5" onSubmit={handleCreateAdmin}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 mb-2">Ad Soyad</label>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white" placeholder="Məsələn: Aysel Məmmədova" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 mb-2">Email</label>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white" placeholder="admin@oyna.com" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 mb-2">Şifrə</label>
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="text" className="w-full px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white" placeholder="Minimum 6+ simvol" />
              </div>

              <button type="submit" disabled={isCreating} className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold shadow-lg shadow-primary/20 disabled:opacity-70 cursor-pointer">
                {isCreating ? 'Yaradılır...' : 'Admin yarat'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[1.75rem] p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">Admin List</p>
                <h2 className="text-2xl font-extrabold tracking-tight">Bütün adminlər</h2>
              </div>
              <div className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-on-surface dark:text-slate-300">
                {admins.length} admin
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
              </div>
            ) : isError ? (
              <div className="py-20 text-center text-red-600 font-semibold">Adminlər yüklənmədi.</div>
            ) : admins.length === 0 ? (
              <div className="py-20 text-center text-slate-500">Hələ admin yoxdur.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-4">Ad</th>
                      <th className="py-4">Email</th>
                      <th className="py-4">Rol</th>
                      <th className="py-4">Tarix</th>
                      <th className="py-4 text-right">Əməliyyatlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin._id} className="border-b border-slate-100 dark:border-slate-800/50 group">
                        <td className="py-4 font-semibold text-on-surface dark:text-white">{admin.displayName || '-'}</td>
                        <td className="py-4 text-slate-600 dark:text-slate-400">{admin.email}</td>
                        <td className="py-4">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                            {admin.role}
                          </span>
                        </td>
                        <td className="py-4 text-slate-500 text-sm">
                          {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('az-AZ') : '-'}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setResetModal(admin)}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer" 
                              title="Şifrəni yenilə"
                            >
                              <span className="material-symbols-outlined text-xl">lock_reset</span>
                            </button>
                            <button 
                              onClick={() => setDeleteModal(admin)}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer" 
                              title="Admini sil"
                            >
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
