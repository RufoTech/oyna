import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import MapPicker from '../components/MapPicker';
import LogoCropperModal from '../components/LogoCropperModal';
import { useTranslation } from 'react-i18next';
import { useGetVenueByIdQuery, useCreateVenueMutation, useUpdateVenueMutation, useGetBranchesQuery } from '../store/api/venuesApi';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { setStep1, setCurrentVenueId, resetVenueForm, loadVenueForEdit } from '../store/slices/venueFormSlice';
import { formatImageUrl } from '../utils/imageUrl';

const AddVenue = ({ onNavigate }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { id } = useParams();
  const venueForm = useSelector((state) => state.venueForm);
  const [createVenue] = useCreateVenueMutation();
  const [updateVenue] = useUpdateVenueMutation();
  const { data: sharedBranches = [] } = useGetBranchesQuery();
  
  const { data: fetchedVenue } = useGetVenueByIdQuery(id, { 
    skip: !id || (venueForm.currentVenueId === id) 
  });

  useEffect(() => {
    if (fetchedVenue && venueForm.currentVenueId !== id) {
      dispatch(loadVenueForEdit(fetchedVenue));
    }
  }, [fetchedVenue, venueForm.currentVenueId, id, dispatch]);

  const locationCoordinates = venueForm.location?.coordinates || [49.8671, 40.4093];
  const [coords, setCoords] = useState({ lat: locationCoordinates[1], lng: locationCoordinates[0] });
  const [tempCoords, setTempCoords] = useState({ lat: locationCoordinates[1], lng: locationCoordinates[0] });
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocationPicked, setIsLocationPicked] = useState(venueForm.location.address !== '');
  const [address, setAddress] = useState(venueForm.location.address);
  const [city, setCity] = useState(venueForm.location.city);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [branches, setBranches] = useState(venueForm.branches);
  const [branchInput, setBranchInput] = useState('');
  
  const [cropperImage, setCropperImage] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  
  const [name, setName] = useState(venueForm.name);
  const [logo, setLogo] = useState(venueForm.logo);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [category, setCategory] = useState(venueForm.category);
  const [slogan, setSlogan] = useState(venueForm.slogan);
  const [description, setDescription] = useState(venueForm.description);

  useEffect(() => {
    const nextCoordinates = venueForm.location?.coordinates || [49.8671, 40.4093];
    setName(venueForm.name);
    setLogo(venueForm.logo);
    setCategory(venueForm.category);
    setSlogan(venueForm.slogan);
    setDescription(venueForm.description);
    setCoords({ lat: nextCoordinates[1], lng: nextCoordinates[0] });
    setTempCoords({ lat: nextCoordinates[1], lng: nextCoordinates[0] });
    setAddress(venueForm.location.address);
    setCity(venueForm.location.city);
    setIsLocationPicked(venueForm.location.address !== '');
    setBranches(venueForm.branches);
  }, [venueForm]);

  const handleSaveData = async (shouldNavigate = true) => {
    // Basic validation for Step 1
    if (!name.trim() || !category || category === t('addVenue.categoryPlaceholder') || !city.trim() || !address.trim() || !isLocationPicked) {
      toast.error(t('addVenue.fillRequired'));
      return false;
    }

    const step1Data = {
      logo: logo ? logo.trim() : null,
      name: name.trim(),
      category,
      slogan: slogan.trim(),
      description: description.trim(),
      location: {
        type: 'Point',
        coordinates: [coords.lng, coords.lat],
        city,
        address,
      },
      branches,
    };

    dispatch(setStep1(step1Data));

    try {
      let venueId = venueForm.currentVenueId;

      if (venueId) {
        await updateVenue({ id: venueId, ...step1Data }).unwrap();
        toast.info(shouldNavigate ? t('addVenue.dataUpdated') : t('addVenue.draftUpdated'));
      } else {
        const result = await createVenue(step1Data).unwrap();
        venueId = result._id;
        dispatch(setCurrentVenueId(venueId));
        toast.success(t('addVenue.draftCreated'));
      }
      
      if (shouldNavigate) {
        onNavigate('mediaPricing', venueId);
      } else {
        onNavigate('venues');
        dispatch(resetVenueForm());
      }
      return true;
    } catch (error) {
      console.error('Error saving venue:', error);
      const errorMsg = error?.data?.message || t('addVenue.errorSave');
      toast.error(`${t('addVenue.errorPrefix')}${errorMsg}`);
      return false;
    }
  };

  const handleNext = () => handleSaveData(true);
  const handleSaveDraft = () => handleSaveData(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropperImage(reader.result);
      setIsCropperOpen(true);
    });
    reader.readAsDataURL(file);
    
    // Clear the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile) => {
    setIsCropperOpen(false);
    setIsUploadingLogo(true);
    try {
      const url = await uploadImageToCloudinary(croppedFile, 'venues');
      setLogo(url);
      setCropperImage(null);
      toast.success(t('addVenue.logoSuccess'));
    } catch (error) {
      toast.error(t('addVenue.logoError'));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const fetchAddressData = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        // Construct street address: street + house_number or suburb
        const street = addr.road || addr.pedestrian || addr.suburb || '';
        const houseNumber = addr.house_number ? `, ${addr.house_number}` : '';
        const fullAddress = street ? `${street}${houseNumber}` : data.display_name.split(',')[0];
        
        setAddress(fullAddress);
        
        // Try to match city or city_district or town
        const cityName = addr.city || addr.town || addr.city_district || addr.village || '';
        if (cityName) {
          setCity(cityName);
        }
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <>
      <style>{`
        h1, h2, h3, .font-headline { font-family: 'Manrope', sans-serif; }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          display: inline-block;
          line-height: 1;
          vertical-align: middle;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0e2e6; border-radius: 10px; }
        .dark :-webkit-scrollbar-thumb { background: #334155; }
      `}</style>

      <div className="px-12 max-w-6xl mx-auto">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div 
                  onClick={() => onNavigate('venues')}
                  className="flex items-center gap-2 text-primary font-semibold text-sm mb-2 cursor-pointer hover:underline underline-offset-4 decoration-2 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>{t('addVenue.backToVenues')}</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-on-surface dark:text-white mb-2">
                  {venueForm.currentVenueId ? t('addVenue.titleEdit') : t('addVenue.titleAdd')}
                </h1>
                <p className="text-on-surface-variant dark:text-slate-400 max-w-2xl">
                  {venueForm.currentVenueId 
                    ? t('addVenue.descEdit')
                    : t('addVenue.descAdd')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <button onClick={() => onNavigate('addVenue', id)} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-surface dark:ring-slate-950 font-bold text-sm z-30 transition-transform active:scale-90 cursor-pointer">1</button>
                  <button onClick={() => {
                    if (venueForm.currentVenueId || id) onNavigate('mediaPricing', venueForm.currentVenueId || id);
                    else toast.warning(t('addVenue.completeStep1'));
                  }} className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 flex items-center justify-center ring-4 ring-surface dark:ring-slate-950 font-bold text-sm z-20 transition-transform active:scale-90 cursor-pointer">2</button>
                  <button onClick={() => {
                    if (venueForm.currentVenueId || id) onNavigate('calendarAvailability', venueForm.currentVenueId || id);
                    else toast.warning(t('addVenue.completeStep1'));
                  }} className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 flex items-center justify-center ring-4 ring-surface dark:ring-slate-950 font-bold text-sm z-10 transition-transform active:scale-90 cursor-pointer">3</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              <div className="lg:col-span-7 space-y-8">
                <section className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-transparent dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    </div>
                    <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white">{t('addVenue.step1Title')}</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-surface-container-high dark:border-slate-800">
                      <div className="relative group">
                        <label className="w-24 h-24 rounded-full bg-surface-container-low dark:bg-slate-800 border-2 border-dashed border-outline-variant dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden">
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                          {logo ? (
                            <img src={formatImageUrl(logo)} alt="Venue Logo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-outline transition-transform group-hover:scale-110">
                              <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                              <span className="text-[10px] font-bold uppercase mt-1">{t('addVenue.logoLabel')}</span>
                            </div>
                          )}
                          {isUploadingLogo && (
                            <div className="absolute inset-0 bg-surface/60 backdrop-blur-sm flex items-center justify-center">
                              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                            </div>
                          )}
                        </label>
                        {logo && !isUploadingLogo && (
                          <button 
                            onClick={() => setLogo('')}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 text-center md:text-left">
                        <h4 className="font-bold text-on-surface dark:text-white">{t('addVenue.venueLogoTitle')}</h4>
                        <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-[240px]">{t('addVenue.venueLogoDesc')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 ml-1">{t('addVenue.venueNameLabel')}</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-slate-500" placeholder={t('addVenue.venueNamePlaceholder')} type="text" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 ml-1">{t('addVenue.categoryLabel')}</label>
                        <div className="relative">
                          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface dark:text-white appearance-none">
                            <option className="dark:bg-slate-900">{t('addVenue.categoryPlaceholder')}</option>
                            <option className="dark:bg-slate-900">{t('addVenue.catInternet')}</option>
                            <option className="dark:bg-slate-900">{t('addVenue.catPs')}</option>
                            <option className="dark:bg-slate-900">{t('addVenue.catKaraoke')}</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">expand_more</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 ml-1">{t('addVenue.sloganLabel')}</label>
                      <input value={slogan} onChange={(e) => setSlogan(e.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-slate-500" placeholder={t('addVenue.sloganPlaceholder')} type="text" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 ml-1">{t('addVenue.detailsLabel')}</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-slate-500 resize-none" placeholder={t('addVenue.detailsPlaceholder')} rows="4"></textarea>
                    </div>
                  </div>
                </section>

                <section className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-transparent dark:border-slate-800 transition-all duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white">{t('addVenue.branchTitle')}</h3>
                        <p className="text-xs text-on-surface-variant dark:text-slate-400">{t('addVenue.branchDesc')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <div className="flex-1 relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">add_business</span>
                        <input 
                          type="text"
                          value={branchInput}
                          onChange={(e) => setBranchInput(e.target.value)}
                          placeholder={t('addVenue.newBranchPlaceholder')}
                          className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-slate-500"
                        />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          if (branchInput.trim()) {
                            setBranches([branchInput.trim()]);
                            setBranchInput('');
                            toast.info(t('addVenue.branchCreated', { branchName: branchInput.trim() }));
                          }
                        }}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all"
                      >
                        {t('addVenue.btnCreate')}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 ml-1">{t('addVenue.existingBranches')}</label>
                      {sharedBranches.length > 0 || branches.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                          {[...new Set([...sharedBranches, ...branches])].map((branch, index) => {
                            const isSelected = branches.includes(branch);
                            return (
                              <div 
                                key={index} 
                                onClick={() => setBranches([branch])}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                                  isSelected 
                                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-none ring-4 ring-indigo-500/10' 
                                  : 'bg-surface-container-low dark:bg-slate-800 border-transparent hover:border-indigo-200'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                    isSelected ? 'bg-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-700 border-2 border-outline-variant dark:border-slate-600 group-hover:border-indigo-300'
                                  }`}>
                                    {isSelected && <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>}
                                  </div>
                                  <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-on-surface dark:text-slate-300'}`}>
                                    {branch}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-10 border-2 border-dashed border-outline-variant/30 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-on-surface-variant/40 dark:text-slate-600">
                          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">layers</span>
                          <p className="text-xs font-medium italic">{t('addVenue.noBranches')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-5 space-y-8">
                <section className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-transparent dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pin_drop</span>
                    </div>
                    <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white">{t('addVenue.venueDetailsTitle')}</h3>
                  </div>
                  <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 ml-1">{t('addVenue.cityLabel')}</label>
                        <div className="relative">
                          <input 
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder={t('addVenue.cityPlaceholder')}
                            className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-slate-500"
                          />
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">location_city</span>
                        </div>
                      </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 ml-1">{t('addVenue.streetLabel')}</label>
                      <input 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface dark:text-white placeholder:text-slate-500" 
                        placeholder={t('addVenue.streetPlaceholder')} 
                        type="text" 
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 ml-1">{t('addVenue.mapCoordsTitle')}</label>
                        <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{t('addVenue.autoDetect')}</span>
                      </div>
                      {isLocationPicked ? (
                        <div 
                          className="relative rounded-xl overflow-hidden aspect-[4/3] group border-4 border-surface-container-low dark:border-slate-800 cursor-pointer z-0"
                          onClick={() => {
                            setTempCoords(coords);
                            setIsMapModalOpen(true);
                          }}
                        >
                          <MapPicker 
                            key={`${coords.lat}-${coords.lng}-readonly`}
                            defaultLat={coords.lat} 
                            defaultLng={coords.lng} 
                            readOnly={true}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white z-10 backdrop-blur-[2px]">
                            <span className="material-symbols-outlined text-4xl mb-2">edit_location</span>
                            <span className="font-bold text-sm tracking-wide">{t('addVenue.changeLocation')}</span>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => {
                            setTempCoords(coords);
                            setIsMapModalOpen(true);
                          }}
                          className="relative rounded-xl overflow-hidden aspect-[4/3] group border-2 border-dashed border-outline-variant/30 dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800 cursor-pointer flex flex-col items-center justify-center transition-all hover:bg-surface-container-low hover:border-primary/50 z-0"
                        >
                          <div className="flex flex-col items-center justify-center text-on-surface-variant dark:text-slate-500 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-4xl mb-2">add_location</span>
                            <span className="font-bold text-sm tracking-wide">{t('addVenue.addLocation')}</span>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-container-low dark:bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between border border-transparent">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant dark:text-slate-400">{t('addVenue.lat')}</span>
                          <span className="text-sm font-medium dark:text-slate-200">{coords.lat.toFixed(4)}°</span>
                        </div>
                        <div className="bg-surface-container-low dark:bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between border border-transparent">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant dark:text-slate-400">{t('addVenue.lng')}</span>
                          <span className="text-sm font-medium dark:text-slate-200">{coords.lng.toFixed(4)}°</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

            </div>

            <div className="mt-12 flex justify-between items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl">
              <div className="w-32"></div>
              <div className="flex gap-2">
                <div className="w-8 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary/20"></div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleSaveDraft}
                  className="px-6 py-2 rounded-xl font-bold text-sm bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-slate-300 hover:bg-surface-container-highest transition-all"
                >
                  {t('addVenue.btnDraft')}
                </button>
                <button onClick={handleNext} className="flex items-center gap-2 text-primary font-black group transition-all">
                  {t('addVenue.btnNext')}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

      {isMapModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-surface dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-6 border-b border-outline-variant/20 dark:border-slate-800 bg-surface dark:bg-slate-950 md:px-10">
            <div>
              <h2 className="text-2xl font-headline font-bold text-on-surface dark:text-white">{t('addVenue.mapModalTitle')}</h2>
              <p className="text-sm text-on-surface-variant dark:text-slate-400">{t('addVenue.mapModalDesc')}</p>
            </div>
            <button 
              onClick={() => setIsMapModalOpen(false)}
              className="w-10 h-10 rounded-full bg-surface-container dark:bg-slate-800 hover:bg-surface-container-high text-on-surface dark:text-white flex items-center justify-center transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex-1 relative z-0">
            <MapPicker 
              key={`${tempCoords.lat}-${tempCoords.lng}-editable`}
              defaultLat={tempCoords.lat} 
              defaultLng={tempCoords.lng} 
              onChange={(lat, lng) => setTempCoords({ lat, lng })}
            />
          </div>

          <div className="p-6 border-t border-outline-variant/20 bg-surface dark:bg-slate-950 flex items-center justify-between md:px-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-6">
              <div className="bg-surface-container-low dark:bg-slate-800 rounded-xl px-4 py-3 border border-outline-variant/30 hidden sm:flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant dark:text-slate-400">{t('addVenue.latExt')}</span>
                <span className="text-sm font-medium text-primary">{tempCoords.lat.toFixed(4)}°</span>
              </div>
              <div className="bg-surface-container-low dark:bg-slate-800 rounded-xl px-4 py-3 border border-outline-variant/30 hidden sm:flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant dark:text-slate-400">{t('addVenue.lngExt')}</span>
                <span className="text-sm font-medium text-primary">{tempCoords.lng.toFixed(4)}°</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMapModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-sm text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
              >
                {t('addVenue.cancel')}
              </button>
              <button 
                onClick={() => {
                  setCoords(tempCoords);
                  setIsLocationPicked(true);
                  setIsMapModalOpen(false);
                  fetchAddressData(tempCoords.lat, tempCoords.lng);
                }}
                disabled={isGeocoding}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGeocoding ? (
                  <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">save</span>
                )}
                {isGeocoding ? t('addVenue.findingAddress') : t('addVenue.saveLocation')}
              </button>
            </div>
          </div>
        </div>
      )}
      {isCropperOpen && (
        <LogoCropperModal
          image={cropperImage}
          onCancel={() => {
            setIsCropperOpen(false);
            setCropperImage(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};

export default AddVenue;
