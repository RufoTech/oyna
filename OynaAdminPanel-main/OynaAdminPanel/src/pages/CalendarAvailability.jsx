import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetVenueByIdQuery, useUpdateVenueMutation } from '../store/api/venuesApi';
import { setStep3, resetVenueForm, loadVenueForEdit } from '../store/slices/venueFormSlice';
import { useTranslation } from 'react-i18next';

const CalendarAvailability = ({ onNavigate }) => {
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

  const [schedule, setSchedule] = useState(venueForm.schedule);
  const [phone, setPhone] = useState(venueForm.contact.phone || '+994 ');
  const [email, setEmail] = useState(venueForm.contact.email || '');
  const [instagram, setInstagram] = useState(venueForm.contact.instagram || '');
  const [whatsapp, setWhatsapp] = useState(venueForm.contact.whatsapp || '');
  const [website, setWebsite] = useState(venueForm.contact.website || '');
  const [gracePeriod, setGracePeriod] = useState(venueForm.bookingRules?.gracePeriod ?? 30);
  const [is24_7, setIs24_7] = useState(venueForm.operatingHours?.is24_7 ?? false);
  const [errors, setErrors] = useState({});

  const handleToggle24_7 = () => {
    const nextValue = !is24_7;
    setIs24_7(nextValue);

    if (nextValue) {
      setSchedule((prev) =>
        prev.map((day) => ({
          ...day,
          isOpen: true,
          open: '00:00',
          close: '00:00',
        })),
      );
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'phone':
        const phoneRest = value.replace('+994 ', '').replace(/\s/g, '');
        if (!phoneRest.trim()) return t('calendar.phoneRequired');
        if (!/^\d+$/.test(phoneRest)) return t('calendar.phoneDigitsOnly');
        return null;
      case 'email':
        if (!value.trim()) return t('calendar.emailRequired');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return t('calendar.invalidEmail');
        return null;
      case 'instagram':
        if (!value.trim()) return t('calendar.instagramRequired');
        if (!value.toLowerCase().includes('instagram.com')) return t('calendar.instagramInvalid');
        return null;
      case 'whatsapp':
        if (!value.trim()) return t('calendar.whatsappRequired');
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (name, value) => {
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSaveData = async (shouldPublish = true) => {
    const newErrors = {};
    
    ['phone', 'email', 'instagram', 'whatsapp'].forEach(field => {
      const val = field === 'phone' ? phone : field === 'email' ? email : field === 'instagram' ? instagram : whatsapp;
      const err = validateField(field, val);
      if (err) newErrors[field] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t('calendar.validationError'));
      return false;
    }

    setErrors({}); // Clear errors if validation passes

    const minTimeMinutes = 0;
    const maxTimeMinutes = 1440; // 24 hours

    const step3Data = {
      schedule,
      contact: { phone, email, instagram, whatsapp, website },
      bookingRules: {
        minTimeMinutes,
        maxTimeMinutes,
        gracePeriod: gracePeriod,
      },
    };

    dispatch(setStep3(step3Data));

    if (!venueForm.currentVenueId) {
      return true;
    }

    try {
      const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const scheduleObj = {};

      schedule.forEach((day, index) => {
        scheduleObj[dayKeys[index]] = {
          open: day.open,
          close: day.close,
          closed: !day.isOpen,
        };
      });

      await updateVenue({
        id: venueForm.currentVenueId,
        operatingHours: { is24_7, schedule: scheduleObj },
        contact: { phone, email, instagram, whatsapp, website },
        bookingRules: {
          minTimeMinutes,
          maxTimeMinutes,
          gracePeriod: gracePeriod,
        },
        status: shouldPublish ? 'ACTIVE' : 'DRAFT',
      }).unwrap();

      if (shouldPublish) {
        toast.success(t('calendar.updateSuccess'));
      } else {
        toast.info(t('calendar.draftSaved'));
      }

      dispatch(resetVenueForm());
      onNavigate('venues');
      return true;
    } catch {
      toast.error(t('calendar.saveError'));
      return false;
    }
  };

  const handleFinish = () => handleSaveData(true);
  const handleSaveDraft = () => handleSaveData(false);

  return (
    <>
      <style>{`
        body { font-family: 'Inter', sans-serif; background-color: #f7f9fd; }
        .font-headline { font-family: 'Manrope', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #eceef2; border-radius: 10px; }
      `}</style>

      <div className="px-12 max-w-6xl mx-auto">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <nav className="flex text-xs text-on-surface-variant dark:text-slate-500 mb-2 gap-2 items-center">
              <span onClick={() => onNavigate('venues')} className="cursor-pointer hover:text-primary transition-colors">{t('calendar.venues')}</span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span onClick={() => onNavigate('addVenue', venueForm.currentVenueId || id)} className="cursor-pointer hover:text-primary transition-colors">
                {venueForm.currentVenueId || id ? t('calendar.editVenue') : t('calendar.addVenue')}
              </span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-primary font-medium">{t('calendar.step3')}</span>
            </nav>
            <h2 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface dark:text-white">
              {venueForm.currentVenueId ? t('calendar.configEdit') : t('calendar.config')}
            </h2>
            <p className="text-on-surface-variant dark:text-slate-400 mt-2 text-sm max-w-md">{t('calendar.configDesc')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <button onClick={() => onNavigate('addVenue', venueForm.currentVenueId || id)} className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 flex items-center justify-center ring-4 ring-white dark:ring-slate-950 font-bold text-sm z-30 transition-transform active:scale-90 cursor-pointer">1</button>
              <button onClick={() => onNavigate('mediaPricing', venueForm.currentVenueId || id)} className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 flex items-center justify-center ring-4 ring-white dark:ring-slate-950 font-bold text-sm z-20 transition-transform active:scale-90 cursor-pointer">2</button>
              <button onClick={() => onNavigate('calendarAvailability', venueForm.currentVenueId || id)} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-950 font-bold text-sm z-10 transition-transform active:scale-90 cursor-pointer">3</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] p-8 shadow-sm border border-transparent dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-headline font-bold text-on-surface dark:text-white">{t('calendar.workingHours')}</h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">{t('calendar.workingHoursDesc')}</p>
                </div>
                <div className="flex items-center gap-3 bg-surface-container-low dark:bg-slate-800 px-4 py-2 rounded-full">
                  <span className="text-xs font-semibold text-on-surface-variant dark:text-slate-400">{t('calendar.service24_7')}</span>
                  <button
                    onClick={handleToggle24_7}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none ring-2 ring-primary/0 focus:ring-primary/20 ${is24_7 ? 'bg-primary' : 'bg-surface-variant'}`}
                  >
                    <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${is24_7 ? 'left-6' : 'left-1'}`}></span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {schedule.map((day, index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-500 block text-center">{t(day.label)}</label>
                    {day.isOpen ? (
                      <div className="bg-surface-container-low dark:bg-slate-800 p-2.5 rounded-xl border border-transparent dark:border-slate-700 hover:border-outline-variant/30 transition-all text-center">
                        <input
                          className="w-full bg-transparent border-none p-0 text-center text-sm font-bold text-on-surface dark:text-white focus:ring-0 placeholder:text-on-surface-variant/20 dark:placeholder:text-slate-600 tracking-wider"
                          type="text"
                          placeholder="00:00"
                          maxLength={5}
                          value={day.open}
                          onChange={(e) => {
                            let val = e.target.value;
                            const isDeleting = e.nativeEvent?.inputType === 'deleteContentBackward';
                            let digits = val.replace(/\D/g, '').substring(0, 4);
                            
                            let formatted = digits;
                            if (digits.length >= 3) {
                              formatted = `${digits.substring(0, 2)}:${digits.substring(2)}`;
                            } else if (digits.length === 2) {
                              if (isDeleting && day.open === `${digits}:`) {
                                formatted = digits.substring(0, 1);
                              } else {
                                formatted = `${digits}:`;
                              }
                            }
                            const nextSchedule = [...schedule];
                            nextSchedule[index] = { ...nextSchedule[index], open: formatted };
                            setSchedule(nextSchedule);
                          }}
                        />
                        <div className="h-px bg-outline-variant/30 dark:bg-slate-700 my-1 mx-1"></div>
                        <input
                          className="w-full bg-transparent border-none p-0 text-center text-sm font-bold text-on-surface dark:text-white focus:ring-0 placeholder:text-on-surface-variant/20 dark:placeholder:text-slate-600 tracking-wider"
                          type="text"
                          placeholder="00:00"
                          maxLength={5}
                          value={day.close}
                          onChange={(e) => {
                            let val = e.target.value;
                            const isDeleting = e.nativeEvent?.inputType === 'deleteContentBackward';
                            let digits = val.replace(/\D/g, '').substring(0, 4);
                            
                            let formatted = digits;
                            if (digits.length >= 3) {
                              formatted = `${digits.substring(0, 2)}:${digits.substring(2)}`;
                            } else if (digits.length === 2) {
                              if (isDeleting && day.close === `${digits}:`) {
                                formatted = digits.substring(0, 1);
                              } else {
                                formatted = `${digits}:`;
                              }
                            }
                            const nextSchedule = [...schedule];
                            nextSchedule[index] = { ...nextSchedule[index], close: formatted };
                            setSchedule(nextSchedule);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="bg-surface-container-low dark:bg-slate-800 p-2 rounded-xl border border-transparent dark:border-slate-700 hover:border-outline-variant/30 transition-all text-center opacity-50">
                        <span className="text-xs font-bold text-on-surface-variant dark:text-slate-500 py-4 block">{t('calendar.closed')}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        const nextSchedule = [...schedule];
                        nextSchedule[index] = { ...nextSchedule[index], isOpen: !nextSchedule[index].isOpen };
                        setSchedule(nextSchedule);
                      }}
                      className="w-full py-1 text-[10px] font-bold text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-md transition-colors"
                    >
                      {day.isOpen ? t('calendar.closed') : t('calendar.setHours')}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] p-8 shadow-sm border border-transparent dark:border-slate-800">
              <h3 className="text-lg font-headline font-bold text-on-surface dark:text-white mb-6">{t('calendar.contactSocial')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-500 ml-1">{t('calendar.phoneNumber')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">call</span>
                    <input 
                      value={phone} 
                      onChange={(event) => {
                        let val = event.target.value;
                        if (!val.startsWith('+994 ')) {
                          val = '+994 ' + val.replace(/^\+994\s?/, '');
                        }
                        setPhone(val);
                        if (errors.phone) setErrors(prev => ({...prev, phone: null}));
                      }} 
                      onBlur={() => handleBlur('phone', phone)}
                      className={`w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 transition-all text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 ${errors.phone ? 'ring-2 ring-error/50 bg-error/5 dark:bg-error/10' : 'focus:ring-primary/20'}`} 
                      placeholder="+994 50 000 00 00" 
                      type="text" 
                    />
                  </div>
                  {errors.phone && <p className="text-[10px] text-error font-bold ml-4 animate-in fade-in slide-in-from-top-1">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">{t('calendar.email')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                    <input 
                      value={email} 
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (errors.email) setErrors(prev => ({...prev, email: null}));
                      }} 
                      onBlur={() => handleBlur('email', email)}
                      className={`w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 transition-all text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 ${errors.email ? 'ring-2 ring-error/50 bg-error/5 dark:bg-error/10' : 'focus:ring-primary/20'}`} 
                      placeholder="contact@venue.com" 
                      type="email" 
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-error font-bold ml-4 animate-in fade-in slide-in-from-top-1">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">{t('calendar.instagram')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">camera</span>
                    <input 
                      value={instagram} 
                      onChange={(event) => {
                        setInstagram(event.target.value);
                        if (errors.instagram) setErrors(prev => ({...prev, instagram: null}));
                      }} 
                      onBlur={() => handleBlur('instagram', instagram)}
                      className={`w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 transition-all text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 ${errors.instagram ? 'ring-2 ring-error/50 bg-error/5 dark:bg-error/10' : 'focus:ring-primary/20'}`} 
                      placeholder="instagram.com/mekan" 
                      type="text" 
                    />
                  </div>
                  {errors.instagram && <p className="text-[10px] text-error font-bold ml-4 animate-in fade-in slide-in-from-top-1">{errors.instagram}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">{t('calendar.whatsapp')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">chat</span>
                    <input 
                      value={whatsapp} 
                      onChange={(event) => {
                        setWhatsapp(event.target.value);
                        if (errors.whatsapp) setErrors(prev => ({...prev, whatsapp: null}));
                      }} 
                      onBlur={() => handleBlur('whatsapp', whatsapp)}
                      className={`w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 transition-all text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 ${errors.whatsapp ? 'ring-2 ring-error/50 bg-error/5 dark:bg-error/10' : 'focus:ring-primary/20'}`} 
                      placeholder="wa.me/number" 
                      type="text" 
                    />
                  </div>
                  {errors.whatsapp && <p className="text-[10px] text-error font-bold ml-4 animate-in fade-in slide-in-from-top-1">{errors.whatsapp}</p>}
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-500 ml-1">{t('calendar.website')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-lg">public</span>
                    <input value={website} onChange={(event) => setWebsite(event.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="https://www.example.com" type="text" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] p-8 shadow-sm border border-transparent dark:border-slate-800 mt-6">
              <h3 className="text-lg font-headline font-bold text-on-surface dark:text-white mb-2">{t('calendar.gracePeriod', 'Gecikmə Toleransı (dəq)')}</h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-6">{t('calendar.gracePeriodDesc', 'İstifadəçi bu müddət ərzində gəlməzsə, rezervasiya avtomatik ləğv olunacaq.')}</p>
              
              <div className="flex items-center gap-6">
                <input 
                  type="range" 
                  min="5" 
                  max="60" 
                  step="5"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(parseInt(e.target.value))}
                  className="w-full h-2 bg-surface-container-high dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-lg min-w-[80px] text-center shadow-lg shadow-primary/30">
                  {gracePeriod} {t('common.min', 'dəq')}
                </div>
              </div>
            </div>
          </div>


        </div>

        <div className="mt-12 flex justify-between items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl border border-white/20 dark:border-slate-800">
          <button onClick={() => onNavigate('mediaPricing', venueForm.currentVenueId || id)} className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400 font-bold hover:text-primary transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
            {t('calendar.previous')}
          </button>
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-primary/20"></div>
            <div className="w-8 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2 rounded-xl font-bold text-sm bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-white hover:bg-surface-container-highest dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-700"
            >
              {t('calendar.saveDraft')}
            </button>
            <button onClick={handleFinish} className="flex items-center gap-2 text-primary font-black group transition-all">
              {t('calendar.finishAndPublish')}
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">check_circle</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CalendarAvailability;
