import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetVenueByIdQuery, useUpdateVenueMutation } from '../store/api/venuesApi';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { setStep2, resetVenueForm, loadVenueForEdit } from '../store/slices/venueFormSlice';
import { useTranslation } from 'react-i18next';
import { formatImageUrl } from '../utils/imageUrl';
import { validateImageFile } from '../utils/fileValidation';

const MediaPricing = ({ onNavigate }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { id } = useParams();
  const venueForm = useSelector((state) => state.venueForm);
  const [updateVenue] = useUpdateVenueMutation();
  
  const { data: fetchedVenue } = useGetVenueByIdQuery(id, { 
    skip: !id || venueForm.currentVenueId === id 
  });

  useEffect(() => {
    if (fetchedVenue && venueForm.currentVenueId !== id) {
      dispatch(loadVenueForEdit(fetchedVenue));
    }
  }, [fetchedVenue, venueForm.currentVenueId, id, dispatch]);

  const [heroImages, setHeroImages] = useState(
    venueForm.heroImage ? (Array.isArray(venueForm.heroImage) ? venueForm.heroImage : [venueForm.heroImage]) : [],
  );
  const [gallery, setGallery] = useState(venueForm.gallery || []);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [basePrice, setBasePrice] = useState(venueForm.basePrice || 0);

  // Sync local state when venueForm redux state changes (e.g. after asynchronous fetch)
  useEffect(() => {
    setHeroImages(
      venueForm.heroImage ? (Array.isArray(venueForm.heroImage) ? venueForm.heroImage : [venueForm.heroImage]) : []
    );
    setGallery(venueForm.gallery || []);
    setBasePrice(venueForm.basePrice || 0);
  }, [venueForm]);

  const handleHeroUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Filter files based on validation
    const validFiles = files.filter(file => validateImageFile(file));
    if (!validFiles.length) {
      event.target.value = '';
      return;
    }

    setIsUploadingHero(true);
    for (const file of validFiles) {
      try {
        const url = await uploadImageToCloudinary(file, 'venues');
        setHeroImages((prev) => [...prev, url]);
      } catch (err) {
        if (!err?.isValidationError) {
          toast.error(t('media.uploadError'));
        }
      }
    }
    event.target.value = ''; // Reset input
    setIsUploadingHero(false);
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Filter files based on validation
    const validFiles = files.filter(file => validateImageFile(file));
    if (!validFiles.length) {
      event.target.value = '';
      return;
    }

    setIsUploadingGallery(true);
    for (const file of validFiles) {
      try {
        const url = await uploadImageToCloudinary(file, 'venues');
        setGallery((prev) => [...prev, url]);
      } catch (err) {
        if (!err?.isValidationError) {
          toast.error(t('media.uploadError'));
        }
      }
    }
    event.target.value = ''; // Reset input
    setIsUploadingGallery(false);
  };

  const handleSaveData = async (shouldNavigate = true) => {
    if (heroImages.length === 0) {
      toast.error(t('media.heroRequired'));
      return false;
    }

    if (gallery.length === 0) {
      toast.error(t('media.galleryRequired'));
      return false;
    }

    if (!basePrice || basePrice <= 0) {
      toast.error(t('media.invalidPrice'));
      return false;
    }

    dispatch(
      setStep2({
        heroImage: heroImages,
        gallery,
        basePrice: parseFloat(basePrice),
      }),
    );

    if (!venueForm.currentVenueId) {
      return true;
    }

    try {
      await updateVenue({
        id: venueForm.currentVenueId,
        media: { heroImage: heroImages, gallery },
        pricing: { basePrice: parseFloat(basePrice), peakPricingEnabled: false },
      }).unwrap();

      toast.info(shouldNavigate ? t('media.updated') : t('media.draftSaved'));

      if (shouldNavigate) {
        onNavigate('calendarAvailability', venueForm.currentVenueId || id);
      } else {
        dispatch(resetVenueForm());
        onNavigate('venues');
      }

      return true;
    } catch {
      toast.error(t('media.saveError'));
      return false;
    }
  };

  const handleNext = () => handleSaveData(true);
  const handleSaveDraft = () => handleSaveData(false);

  return (
    <>


      <div className="px-10">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <nav className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400 font-medium mb-2">
              <button className="hover:text-primary transition-colors" onClick={() => onNavigate('venues')}>{t('calendar.venues')}</button>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <button className="hover:text-primary transition-colors" onClick={() => onNavigate('addVenue', venueForm.currentVenueId || id)}>
                {venueForm.currentVenueId || id ? t('calendar.editVenue') : t('calendar.addVenue')}
              </button>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface dark:text-white">{t('media.title')}</span>
            </nav>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface dark:text-white">
              {venueForm.currentVenueId ? t('media.step2Edit') : t('media.step2')}
            </h2>
            <p className="text-on-surface-variant dark:text-slate-400 mt-1">{t('media.desc')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <button onClick={() => onNavigate('addVenue', venueForm.currentVenueId || id)} className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 flex items-center justify-center ring-4 ring-white dark:ring-slate-950 font-bold text-sm z-30 transition-transform active:scale-90 cursor-pointer">1</button>
              <button onClick={() => onNavigate('mediaPricing', venueForm.currentVenueId || id)} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-950 font-bold text-sm z-20 transition-transform active:scale-90 cursor-pointer">2</button>
              <button onClick={() => onNavigate('calendarAvailability', venueForm.currentVenueId || id)} className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 flex items-center justify-center ring-4 ring-white dark:ring-slate-950 font-bold text-sm z-10 transition-transform active:scale-90 cursor-pointer">3</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] p-8 shadow-sm border border-transparent dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-primary/10 text-primary rounded-lg">
                  <span className="material-symbols-outlined">image</span>
                </span>
                <h3 className="text-xl font-bold text-on-surface dark:text-white">{t('media.mainMedia')}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {heroImages.map((url, index) => (
                  <div key={index} className="aspect-video rounded-xl overflow-hidden relative group border border-outline-variant/30">
                    <img className="w-full h-full object-cover" alt={`hero-${index}`} src={formatImageUrl(url)} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => setHeroImages(heroImages.filter((_, itemIndex) => itemIndex !== index))} className="p-2 bg-error rounded-full text-white cursor-pointer hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                <label className="aspect-video rounded-xl border-2 border-dashed border-outline-variant dark:border-slate-700 bg-surface-container-low dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container dark:hover:bg-slate-700 transition-colors relative">
                  <input type="file" multiple className="hidden" accept="image/*" onChange={handleHeroUpload} disabled={isUploadingHero} />
                  {isUploadingHero ? (
                    <span className="material-symbols-outlined text-outline dark:text-slate-500 animate-spin">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-outline dark:text-slate-500">add_photo_alternate</span>
                      <span className="text-[10px] uppercase font-bold text-outline dark:text-slate-500 mt-1 tracking-wider">{t('media.addPhoto')}</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] p-8 shadow-sm border border-transparent dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-secondary/10 text-secondary rounded-lg">
                    <span className="material-symbols-outlined">photo_library</span>
                  </span>
                  <h3 className="text-xl font-bold text-on-surface dark:text-white">{t('media.gallery')}</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {gallery.map((url, index) => (
                  <div key={index} className="aspect-square rounded-xl overflow-hidden relative group border border-outline-variant/30">
                    <img className="w-full h-full object-cover" alt={`gallery-${index}`} src={formatImageUrl(url)} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => setGallery(gallery.filter((_, itemIndex) => itemIndex !== index))} className="p-2 bg-error rounded-full text-white cursor-pointer hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                <label className="aspect-square rounded-xl border-2 border-dashed border-outline-variant dark:border-slate-700 bg-surface-container-low dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container dark:hover:bg-slate-700 transition-colors relative">
                  <input type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} disabled={isUploadingGallery} />
                  {isUploadingGallery ? (
                    <span className="material-symbols-outlined text-outline dark:text-slate-500 animate-spin">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-outline dark:text-slate-500">add_a_photo</span>
                      <span className="text-[10px] uppercase font-bold text-outline dark:text-slate-500 mt-1 tracking-wider">{t('media.upload')}</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] p-8 shadow-sm relative overflow-hidden border border-transparent dark:border-slate-800">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="p-2 bg-tertiary/10 text-tertiary rounded-lg">
                    <span className="material-symbols-outlined">payments</span>
                  </span>
                  <h3 className="text-xl font-bold text-on-surface dark:text-white">{t('media.basePrice')}</h3>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant dark:text-slate-400 mb-2">{t('media.hourlyRate')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-500 font-bold">₼</span>
                    <input value={basePrice} onChange={(event) => setBasePrice(event.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 rounded-xl py-3 pl-8 pr-4 border-none focus:ring-2 focus:ring-primary/20 text-lg font-bold outline-none transition-all text-on-surface dark:text-white" type="number" step="0.01" min="1" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-tertiary/5 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] p-6 shadow-sm border border-outline-variant/10 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2 bg-primary/10 text-primary rounded-lg">
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400">{t('media.livePreview')}</h3>
              </div>
              <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-md border border-outline-variant/20 dark:border-slate-700">
                <div className="relative aspect-video">
                  <img alt="Preview" className="w-full h-full object-cover" src={formatImageUrl(heroImages[0])} />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-lg text-on-surface dark:text-white">{venueForm.name || t('media.venueNamePlaceholder')}</h4>
                    <div className="text-right">
                      <p className="text-primary font-black text-lg">₼{basePrice}<span className="text-[10px] text-on-surface-variant dark:text-slate-500 font-medium">{t('media.hourly')}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>{venueForm.location?.city || t('venues.table.unknown')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl border border-white/20 dark:border-slate-800">
          <button onClick={() => onNavigate('addVenue', venueForm.currentVenueId || id)} className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400 font-bold hover:text-primary transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
            {t('media.previous')}
          </button>
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary/20"></div>
            <div className="w-8 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-primary/20"></div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2 rounded-xl font-bold text-sm bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-white hover:bg-surface-container-highest dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-700"
            >
              {t('calendar.saveDraft')}
            </button>
            <button onClick={handleNext} className="flex items-center gap-2 text-primary font-black group transition-all">
              {t('media.next')}
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MediaPricing;
