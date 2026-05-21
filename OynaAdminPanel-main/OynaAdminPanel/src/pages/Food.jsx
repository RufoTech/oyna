import React from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useDeleteFoodMutation, useGetFoodsQuery } from '../store/api/foodApi';
import { formatImageUrl } from '../utils/imageUrl';

const Food = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { data: foods = [], isLoading, isError } = useGetFoodsQuery();
  const [deleteFood] = useDeleteFoodMutation();
  const [deleteModalFood, setDeleteModalFood] = React.useState(null);

  const handleDeleteFood = async () => {
    if (!deleteModalFood) return;
    try {
      await deleteFood(deleteModalFood._id).unwrap();
      toast.success(t('food.toasts.deleteSuccess'));
      setDeleteModalFood(null);
    } catch (error) {
      toast.error(error?.data?.message || t('food.toasts.deleteError'));
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
    return <div className="p-8 text-error">{t('food.toasts.loadError')}</div>;
  }

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

      {deleteModalFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-surface-container-lowest dark:bg-slate-900 shadow-2xl border border-surface-container-high dark:border-slate-800 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center">
                <span className="material-symbols-outlined">delete</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface dark:text-white">{t('food.deleteTitle')}</h3>
                <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('food.deleteDesc')}</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-6">
              {t('food.deleteConfirm', { name: deleteModalFood.name })}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModalFood(null)}
                className="px-5 py-3 rounded-2xl bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-white font-bold hover:bg-surface-container-highest dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteFood}
                className="px-5 py-3 rounded-2xl bg-error text-white font-bold hover:opacity-90 transition-all cursor-pointer"
              >
                {t('food.table.actions')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface dark:text-white">{t('food.title')}</h2>
            <p className="text-on-surface-variant dark:text-slate-400 font-medium">{t('food.subtitle')}</p>
          </div>
          <button
            onClick={() => onNavigate('addFood')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">restaurant</span>
            {t('food.addFood')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] p-6 cloud-shadow relative overflow-hidden border border-surface-container-high dark:border-slate-800">
            <p className="text-xs uppercase tracking-[0.2em] font-black text-on-surface-variant dark:text-slate-500 mb-3">{t('food.totalFoods')}</p>
            <h3 className="text-4xl font-black text-on-surface dark:text-white">{foods.length}</h3>
            <p className="mt-3 text-sm text-on-surface-variant dark:text-slate-400 font-medium">{t('food.totalFoodsDesc')}</p>
            <span className="material-symbols-outlined absolute -right-3 -bottom-3 text-[92px] text-primary/10">fastfood</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.75rem] cloud-shadow overflow-hidden border border-surface-container-high dark:border-slate-800">
          <div className="px-6 py-5 border-b border-surface-container-high dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-on-surface dark:text-white tracking-tight">{t('food.foodList')}</h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('food.foodListDesc')}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/70 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-400">{t('food.table.img')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-400">{t('food.table.name')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-400">{t('food.table.category')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-400">{t('food.table.price')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-400">{t('food.table.desc')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-400 text-right">{t('food.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {foods.length > 0 ? (
                  foods.map((food) => (
                    <tr key={food._id} className="border-t border-surface-container-high/70 dark:border-slate-800 hover:bg-surface-container-low/40 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container dark:bg-slate-800 flex items-center justify-center">
                          {food.image ? (
                            <img src={formatImageUrl(food.image)} alt={food.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-500">fastfood</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-on-surface dark:text-white">{food.name}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wide">
                          {food.category}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-lg font-black text-on-surface dark:text-white">₼{Number(food.price || 0).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-5 max-w-sm">
                        <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-6">{food.description || '-'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onNavigate('editFood', food._id)}
                            className="p-2 rounded-xl text-on-surface-variant dark:text-slate-400 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteModalFood(food)}
                            className="p-2 rounded-xl text-on-surface-variant dark:text-slate-400 hover:text-error hover:bg-error/5 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-14 text-center text-on-surface-variant">
                      {t('food.noFoods')}
                    </td>
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

export default Food;
