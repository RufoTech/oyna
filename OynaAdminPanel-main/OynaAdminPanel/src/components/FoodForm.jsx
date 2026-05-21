import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { useGetFoodsQuery } from '../store/api/foodApi';
import { formatImageUrl } from '../utils/imageUrl';

const defaultCategoryOptions = ['Burger', 'Fast Food', 'Drink', 'Pizza', 'Dessert'];

const emptyForm = {
  name: '',
  category: 'Burger',
  price: '',
  description: '',
  image: '',
};

const mapInitialValues = (initialValues) => ({
  name: initialValues?.name || '',
  category: initialValues?.category || 'Burger',
  price: initialValues?.price?.toString() || '',
  description: initialValues?.description || '',
  image: initialValues?.image || '',
});

const FoodForm = ({ mode = 'create', initialValues, isSubmitting = false, onNavigate, onSubmit }) => {
  const { t } = useTranslation();
  const { data: foods = [] } = useGetFoodsQuery();
  const [form, setForm] = useState(() => mapInitialValues(initialValues || emptyForm));
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCategoryListOpen, setIsCategoryListOpen] = useState(false);

  // Combine default categories with unique ones from the database
  const availableCategories = useMemo(() => {
    const dbCategories = foods.map((f) => f.category).filter(Boolean);
    return [...new Set([...defaultCategoryOptions, ...dbCategories])];
  }, [foods]);

  const filteredCategories = useMemo(() => {
    if (!form.category) return availableCategories;
    return availableCategories.filter((c) =>
      c.toLowerCase().includes(form.category.toLowerCase())
    );
  }, [availableCategories, form.category]);

  const pageTitle = mode === 'edit' ? t('food.editTitle') : t('food.addTitle');
  const pageSubtitle =
    mode === 'edit'
      ? t('food.editSubtitle')
      : t('food.addSubtitle');

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file, 'foods');
      updateField('image', imageUrl);
      toast.success(t('food.toasts.uploadSuccess'));
    } catch {
      toast.error(t('food.toasts.uploadError'));
    }

    setIsUploadingImage(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.category || !form.price || Number(form.price) < 0) {
      toast.error(t('food.toasts.validationError'));
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      image: form.image.trim(),
    });
  };

  return (
    <>
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .cloud-shadow {
          box-shadow: 0px 20px 40px rgba(25, 28, 31, 0.06);
        }
        /* Custom scrollbar for category list */
        .category-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .category-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .category-scroll::-webkit-scrollbar-thumb {
          background: rgba(var(--primary-rgb), 0.1);
          border-radius: 10px;
        }
      `}</style>

      <div className="px-8 max-w-6xl mx-auto space-y-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div
              onClick={() => onNavigate('food')}
              className="flex items-center gap-2 text-primary font-semibold text-sm mb-3 cursor-pointer hover:underline underline-offset-4"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>{t('food.backToList')}</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface dark:text-white font-headline">{pageTitle}</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-2">{pageSubtitle}</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em]">
              {mode === 'edit' ? t('common.edit') : t('food.table.actions')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-7 bg-surface-container-lowest dark:bg-slate-900 rounded-[1.75rem] p-8 cloud-shadow border border-surface-container-high dark:border-slate-800">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">restaurant_menu</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-on-surface dark:text-white">{t('food.detailsTitle')}</h2>
                <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('food.detailsSubtitle')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-500">{t('food.labels.name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={t('food.placeholders.name')}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-on-surface dark:text-white focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-outline"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-500">{t('food.labels.category')}</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={form.category}
                      onFocus={() => setIsCategoryListOpen(true)}
                      onBlur={() => setTimeout(() => setIsCategoryListOpen(false), 200)}
                      onChange={(e) => updateField('category', e.target.value)}
                      placeholder={t('food.placeholders.category')}
                      className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-on-surface dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-500 pointer-events-none group-focus-within:rotate-180 transition-transform">
                      expand_more
                    </span>
                    
                    {isCategoryListOpen && filteredCategories.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-surface-container-lowest dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-48 overflow-y-auto category-scroll">
                          {filteredCategories.map((category) => (
                            <div
                              key={category}
                              onClick={() => {
                                updateField('category', category);
                                setIsCategoryListOpen(false);
                              }}
                              className="px-5 py-3 text-sm text-on-surface dark:text-white hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                            >
                              {category}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-500">{t('food.labels.price')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-500 font-black">₼</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-2xl pl-10 pr-4 py-4 text-on-surface dark:text-white focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-outline"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-500">{t('food.labels.desc')}</label>
                <textarea
                  rows="6"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder={t('food.placeholders.desc')}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-on-surface dark:text-white focus:ring-2 focus:ring-primary/20 outline-none resize-none placeholder:text-outline"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-500">{t('food.labels.img')}</label>
                <label className="w-full min-h-48 bg-surface-container-low dark:bg-slate-800 border-2 border-dashed border-surface-container-high dark:border-slate-700 rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                  />
                  {form.image ? (
                    <div className="w-full space-y-3">
                      <div className="w-full h-40 rounded-2xl overflow-hidden bg-surface-container-high dark:bg-slate-700">
                        <img src={formatImageUrl(form.image)} alt={form.name || 'Food upload preview'} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-primary uppercase tracking-[0.18em]">
                          {isUploadingImage ? t('common.loading') : t('food.placeholders.imgDesc')}
                        </span>
                        <span className="material-symbols-outlined text-primary">upload</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-700 flex items-center justify-center text-primary shadow-sm">
                        <span className={`material-symbols-outlined text-3xl ${isUploadingImage ? 'animate-spin' : ''}`}>
                          {isUploadingImage ? 'progress_activity' : 'add_photo_alternate'}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-on-surface dark:text-white">{t('food.labels.img')}</p>
                        <p className="text-xs text-on-surface-variant dark:text-slate-500 mt-1">{t('food.placeholders.imgDesc')}</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.75rem] p-8 cloud-shadow border border-surface-container-high dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined">image</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface dark:text-white">{t('food.preview.title')}</h3>
                  <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('food.preview.subtitle')}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] overflow-hidden bg-surface-container-low dark:bg-slate-800/50 border border-surface-container-high dark:border-slate-700">
                <div className="aspect-[4/3] bg-surface-container dark:bg-slate-800">
                  {form.image ? (
                    <img src={formatImageUrl(form.image)} alt={form.name || 'Food preview'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant dark:text-slate-500">
                      <span className="material-symbols-outlined text-5xl">fastfood</span>
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-lg font-black text-on-surface dark:text-white">{form.name || t('food.preview.emptyName')}</h4>
                    <span className="text-primary font-black text-lg">{form.price ? `₼${form.price}` : '₼0.00'}</span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wide">
                    {form.category}
                  </span>
                  <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-6">
                    {form.description || t('food.preview.emptyDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-6 rounded-[1.5rem] flex items-center justify-between border border-white/20 dark:border-slate-700/50">
              <button
                onClick={() => onNavigate('food')}
                className="px-5 py-3 rounded-2xl bg-surface-container-high dark:bg-slate-700 text-on-surface dark:text-white font-bold hover:bg-surface-container-highest dark:hover:bg-slate-600 transition-all cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-black shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">
                  {isSubmitting ? 'progress_activity' : mode === 'edit' ? 'save' : 'add_circle'}
                </span>
                {mode === 'edit' ? t('food.editTitle') : t('food.addTitle')}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default FoodForm;
