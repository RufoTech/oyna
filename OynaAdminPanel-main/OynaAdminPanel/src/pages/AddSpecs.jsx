/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization, react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useGetVenuesQuery, useGetVenueByIdQuery, useGetVenueSpecsQuery, useUpdateVenueSpecsMutation } from '../store/api/venuesApi';
import { loadVenueForEdit } from '../store/slices/venueFormSlice';
import { toast } from 'react-toastify';
import { FaPlaystation, FaMemory } from "react-icons/fa";
import { BsPcDisplay, BsGpuCard, BsFillMotherboardFill } from "react-icons/bs";
import { MdMeetingRoom } from "react-icons/md";
import { GoCpu } from "react-icons/go";
import { FiMonitor } from "react-icons/fi";
import { PiOfficeChairFill } from "react-icons/pi";
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { useTranslation } from 'react-i18next';
import { formatImageUrl } from '../utils/imageUrl';


const AddSpecs = () => {
  const { t } = useTranslation();
  // ══════════════════════════════════════════════════════════
  // RTK QUERY — Get venue ID & fetch/save specs
  // ══════════════════════════════════════════════════════════
  const dispatch = useDispatch();
  const { id } = useParams();
  const venueForm = useSelector((state) => state.venueForm);
  const { data: venues = [] } = useGetVenuesQuery();
  
  // Recovery: if ID in URL but state is empty, fetch venue
  const { data: fetchedVenue } = useGetVenueByIdQuery(id, {
    skip: !id || venueForm.currentVenueId === id
  });

  useEffect(() => {
    if (fetchedVenue && venueForm.currentVenueId !== id) {
      dispatch(loadVenueForEdit(fetchedVenue));
    }
  }, [fetchedVenue, venueForm.currentVenueId, id, dispatch]);

  // Auto-detect venue ID: prefer URL param, then venueFormSlice, then fallback
  const venueId = id || venueForm.currentVenueId || venues[0]?._id;

  const {
    data: savedSpecs,
    isLoading: isLoadingSpecs,
    isSuccess: isSpecsLoaded,
  } = useGetVenueSpecsQuery(venueId, { skip: !venueId });

  const [updateVenueSpecs, { isLoading: isSaving }] = useUpdateVenueSpecsMutation();

  // ══════════════════════════════════════════════════════════
  // PAGE-LEVEL STATE (Header — goes to backend)
  // ══════════════════════════════════════════════════════════
  const [pageTitle, setPageTitle] = useState('');
  const [pageSubtitle, setPageSubtitle] = useState('');

  // ══════════════════════════════════════════════════════════
  // TIERS STATE (Dynamic — each tier is independent)
  // ══════════════════════════════════════════════════════════
  const [tiers, setTiers] = useState([]);
  const [activeTierId, setActiveTierId] = useState(null);
  const [expandedTierId, setExpandedTierId] = useState(null);
  const [isUploadingMap, setIsUploadingMap] = useState({});

  // ══════════════════════════════════════════════════════════
  // PACKAGES STATE (Dynamic — Xüsusi Paketlər)
  // ══════════════════════════════════════════════════════════
  const [packages, setPackages] = useState([]);

  // ══════════════════════════════════════════════════════════
  // MODAL STATES
  // ══════════════════════════════════════════════════════════
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);

  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [iconModalTarget, setIconModalTarget] = useState('tier');

  // ══════════════════════════════════════════════════════════
  // TEMP FORM STATES (for modals)
  // ══════════════════════════════════════════════════════════
  const [tempHardware, setTempHardware] = useState({ category: 'Processor', name: '', description: '', icon: null });
  const [tempAccessory, setTempAccessory] = useState({ category: 'Mouse', name: '', description: '', icon: null });
  const [tempFeature, setTempFeature] = useState({ text: '', icon: 'star' });

  // ══════════════════════════════════════════════════════════
  // CONSTANTS
  // ══════════════════════════════════════════════════════════
  const hardwareCategories = ['Processor', 'Video Card', 'RAM', 'Monitor', 'Motherboard'];
  const accessoryCategories = ['Mouse', 'Keyboard', 'Headset', 'Mousepad', 'Gaming Chair'];

  const hardwareIcons = [
    { name: 'Processor', icon: <GoCpu />, categoryMatch: 'Processor', type: 'react-icon' },
    { name: 'Video Card', icon: <BsGpuCard />, categoryMatch: 'Video Card', type: 'react-icon' },
    { name: 'RAM', icon: <FaMemory />, categoryMatch: 'RAM', type: 'react-icon' },
    { name: 'Monitor', icon: <FiMonitor />, categoryMatch: 'Monitor', type: 'react-icon' },
    { name: 'Motherboard', icon: <BsFillMotherboardFill />, categoryMatch: 'Motherboard', type: 'react-icon' }
  ];

  const accessoryIcons = [
    { name: 'Mouse', icon: 'mouse', categoryMatch: 'Mouse' },
    { name: 'Keyboard', icon: 'keyboard', categoryMatch: 'Keyboard' },
    { name: 'Headset', icon: 'headphones', categoryMatch: 'Headset' },
    { name: 'Mousepad', icon: 'square', categoryMatch: 'Mousepad' },
    { name: 'Gaming Chair', icon: <PiOfficeChairFill />, categoryMatch: 'Gaming Chair', type: 'react-icon' }
  ];

  const iconLibrary = {
    'Gaming & Esports': [
      { name: 'Playstation', icon: <FaPlaystation />, type: 'react-icon' },
      { name: 'PC Display', icon: <BsPcDisplay />, type: 'react-icon' },
      { name: 'Meeting Room', icon: <MdMeetingRoom />, type: 'react-icon' },
      'sports_esports', 'videogame_asset', 'joystick', 'rocket_launch', 'bolt'
    ],
    'Premium & Rewards': ['workspace_premium', 'diamond', 'star', 'verified'],
    'Venue & Social': ['groups', 'celebration']
  };

  const hydrateIconHelper = (iconName, type) => {
    if (!iconName || typeof iconName !== 'string') return iconName;
    const allLibIcons = Object.values(iconLibrary).flat();
    const found = allLibIcons.find((icon) => typeof icon === 'object' && icon.name === iconName);
    if (found) return found;
    if (type === 'playstation') return { name: 'Playstation', icon: <FaPlaystation />, type: 'react-icon' };
    return iconName;
  };

  const hydrateHardwareIconHelper = (iconName) => {
    if (!iconName || typeof iconName !== 'string') return iconName;
    const found = hardwareIcons.find((icon) => icon.name === iconName);
    return found || hardwareIcons[0];
  };

  const hydrateAccessoryIconHelper = (iconName) => {
    if (!iconName || typeof iconName !== 'string') return iconName;
    const found = accessoryIcons.find((icon) => icon.name === iconName);
    return found || accessoryIcons[0];
  };

  // ══════════════════════════════════════════════════════════
  // HYDRATE STATE FROM BACKEND (when specs load)
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isSpecsLoaded && savedSpecs) {
      setPageTitle(savedSpecs.pageTitle || '');
      setPageSubtitle(savedSpecs.pageSubtitle || '');

      // Restore tiers with local icon objects
      if (savedSpecs.tiers?.length > 0) {
        const hydratedTiers = savedSpecs.tiers.map((t, idx) => ({
          ...t,
          id: t._id || Date.now() + idx,
          heroImage: t.heroImage || '',
          icon: hydrateIconHelper(t.icon, t.type),
          hardware: (t.hardware || []).map((hw, hIdx) => ({
            ...hw,
            id: hw._id || Date.now() + hIdx + 1000,
            icon: hydrateHardwareIconHelper(hw.icon),
          })),
          accessories: (t.accessories || []).map((acc, aIdx) => ({
            ...acc,
            id: acc._id || Date.now() + aIdx + 2000,
            icon: hydrateAccessoryIconHelper(acc.icon),
          })),
          features: (t.features || []).map((f, fIdx) => ({
            ...f,
            id: f._id || Date.now() + fIdx + 3000,
          })),
        }));
        setTiers(hydratedTiers);
      }

      // Restore packages
      if (savedSpecs.packages?.length > 0) {
        const hydratedPackages = savedSpecs.packages.map((p, idx) => ({
          ...p,
          id: p._id || Date.now() + idx + 5000,
        }));
        setPackages(hydratedPackages);
      }
    }
  }, [isSpecsLoaded, savedSpecs]);

  const uploadToCloudinary = async (file) => {
    try {
      return await uploadImageToCloudinary(file, 'venues');
    } catch {
      toast.error(t('addSpecs.uploadError'));
      return null;
    }
  };

  const handleTierHeroUpload = async (tierId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingMap(prev => ({ ...prev, [tierId]: true }));
    const url = await uploadToCloudinary(file);
    if (url) {
      updateTier(tierId, { heroImage: url });
      toast.success(t('addSpecs.imageUploaded'));
    }
    setIsUploadingMap(prev => ({ ...prev, [tierId]: false }));
  };

  // ══════════════════════════════════════════════════════════
  // HYDRATION HELPERS (restore icon name → React component)
  // ══════════════════════════════════════════════════════════
  function _hydrateIcon(iconName, type) {
    if (!iconName || typeof iconName !== 'string') return iconName;
    // Check icon library first
    const allLibIcons = Object.values(iconLibrary).flat();
    const found = allLibIcons.find(i => (typeof i === 'object' && i.name === iconName));
    if (found) return found;
    // Default fallbacks
    if (type === 'playstation') return { name: 'Playstation', icon: <FaPlaystation />, type: 'react-icon' };
    return iconName;
  }

  function _hydrateHardwareIcon(iconName) {
    if (!iconName || typeof iconName !== 'string') return iconName;
    const found = hardwareIcons.find(i => i.name === iconName);
    return found || hardwareIcons[0];
  }

  function _hydrateAccessoryIcon(iconName) {
    if (!iconName || typeof iconName !== 'string') return iconName;
    const found = accessoryIcons.find(i => i.name === iconName);
    return found || accessoryIcons[0];
  }

  // ══════════════════════════════════════════════════════════
  // AUTO-SELECT ICONS ON CATEGORY CHANGE
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    const matchedIcon = hardwareIcons.find(icon => icon.categoryMatch === tempHardware.category);
    if (matchedIcon) {
      setTempHardware(prev => ({ ...prev, icon: matchedIcon }));
    }
  }, [tempHardware.category]);

  useEffect(() => {
    const matchedIcon = accessoryIcons.find(icon => icon.categoryMatch === tempAccessory.category);
    if (matchedIcon) {
      setTempAccessory(prev => ({ ...prev, icon: matchedIcon }));
    }
  }, [tempAccessory.category]);

  // ══════════════════════════════════════════════════════════
  // ICON HELPERS
  // ══════════════════════════════════════════════════════════
  const renderIcon = (iconData, size = "text-xl") => {
    const actualIcon = iconData?.icon || iconData;
    if (typeof actualIcon === 'string') {
      return (
        <span className={`material-symbols-outlined ${size}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {actualIcon}
        </span>
      );
    }
    if (React.isValidElement(actualIcon)) {
      return (
        <div className={`${size === "text-xl" ? "text-xl" : "text-2xl"} flex items-center justify-center`}>
          {actualIcon}
        </div>
      );
    }
    if (actualIcon?.icon && React.isValidElement(actualIcon.icon)) {
      return (
        <div className={`${size === "text-xl" ? "text-xl" : "text-2xl"} flex items-center justify-center`}>
          {actualIcon.icon}
        </div>
      );
    }
    return <span className={`material-symbols-outlined ${size}`}>help</span>;
  };

  const getIconName = (iconData) => {
    if (typeof iconData === 'string') return iconData;
    if (iconData?.name) return iconData.name;
    return 'icon';
  };

  const getIconKey = (icon, index) => {
    if (typeof icon === 'string') return icon;
    if (icon?.name) return icon.name;
    return `icon-${index}`;
  };

  const filteredIcons = useMemo(() => {
    const allIcons = Object.values(iconLibrary).flat();
    if (!iconSearchQuery) return iconLibrary;

    const filtered = allIcons.filter(icon => {
      const name = getIconName(icon);
      return name.toLowerCase().includes(iconSearchQuery.toLowerCase());
    });

    return filtered.length > 0 ? { [t('addSpecs.searchResults')]: filtered } : {};
  }, [iconSearchQuery, t]);

  // ══════════════════════════════════════════════════════════
  // TIER CRUD OPERATIONS
  // ══════════════════════════════════════════════════════════
  const addTier = (type) => {
    const newTier = {
      id: Date.now(),
      type,
      title: type === 'pc' ? t('addSpecs.newPcTierTitle') : t('addSpecs.newPsTierTitle'),
      price: '',
      shortSpec: '',
      heroImage: '',
      icon: type === 'pc' ? 'workspace_premium' : { name: 'Playstation', icon: <FaPlaystation />, type: 'react-icon' },
      hardware: [],
      accessories: [],
      features: [],
      isActive: true
    };
    setTiers(prev => [...prev, newTier]);
    setExpandedTierId(newTier.id);
  };

  const updateTier = (id, updates) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTier = (id) => {
    setTiers(prev => prev.filter(t => t.id !== id));
    if (expandedTierId === id) setExpandedTierId(null);
    if (activeTierId === id) setActiveTierId(null);
  };

  // ══════════════════════════════════════════════════════════
  // TIER-ITEMS ADD FUNCTIONS
  // ══════════════════════════════════════════════════════════
  const addHardwareToTier = () => {
    if (!activeTierId || !tempHardware.name.trim()) return;
    setTiers(prev => prev.map(t => t.id === activeTierId ? {
      ...t,
      hardware: [...t.hardware, { ...tempHardware, id: Date.now() }]
    } : t));
    setIsHardwareModalOpen(false);
    setTempHardware({ category: 'Processor', name: '', description: '', icon: hardwareIcons[0] });
  };

  const addAccessoryToTier = () => {
    if (!activeTierId || !tempAccessory.name.trim()) return;
    setTiers(prev => prev.map(t => t.id === activeTierId ? {
      ...t,
      accessories: [...t.accessories, { ...tempAccessory, id: Date.now() }]
    } : t));
    setIsAccessoryModalOpen(false);
    setTempAccessory({ category: 'Mouse', name: '', description: '', icon: accessoryIcons[0] });
  };

  const addFeatureToTier = () => {
    if (!activeTierId || !tempFeature.text.trim()) return;
    setTiers(prev => prev.map(t => t.id === activeTierId ? {
      ...t,
      features: [...t.features, { ...tempFeature, id: Date.now() }]
    } : t));
    setIsFeaturedModalOpen(false);
    setTempFeature({ text: '', icon: 'star' });
  };

  // ══════════════════════════════════════════════════════════
  // PACKAGES CRUD OPERATIONS
  // ══════════════════════════════════════════════════════════
  const addPackage = () => {
    const newPkg = {
      id: Date.now(),
      title: '',
      description: '',
      price: '',
      hasDiscount: false,
      discountPrice: '',
    };
    setPackages(prev => [...prev, newPkg]);
  };

  const updatePackage = (id, updates) => {
    setPackages(prev =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const nextPackage = { ...p, ...updates };
        const normalPrice = Number(nextPackage.price);
        const discountPrice = Number(nextPackage.discountPrice);

        if (
          nextPackage.hasDiscount &&
          nextPackage.discountPrice !== '' &&
          nextPackage.price !== '' &&
          !Number.isNaN(normalPrice) &&
          !Number.isNaN(discountPrice) &&
          discountPrice > normalPrice
        ) {
          toast.error(t('addSpecs.discountError'));
          return p;
        }

        return nextPackage;
      })
    );
  };

  const removePackage = (id) => {
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  // ══════════════════════════════════════════════════════════
  // SAVE — Serialize & send to backend via RTK mutation
  // ══════════════════════════════════════════════════════════
  const handleSave = async () => {
    if (!venueId) {
      toast.error(t('addSpecs.createVenueError'));
      return;
    }

    const hasInvalidDiscount = packages.some((p) => {
      const normalPrice = Number(p.price);
      const discountPrice = Number(p.discountPrice);

      return (
        p.hasDiscount &&
        p.discountPrice !== '' &&
        p.price !== '' &&
        !Number.isNaN(normalPrice) &&
        !Number.isNaN(discountPrice) &&
        discountPrice > normalPrice
      );
    });

    if (hasInvalidDiscount) {
      toast.error(t('addSpecs.discountError'));
      return;
    }

    const payload = {
      pageTitle,
      pageSubtitle,
      tiers: tiers.map(t => ({
        type: t.type,
        title: t.title,
        price: t.price,
        shortSpec: t.shortSpec,
        heroImage: t.heroImage,
        icon: getIconName(t.icon),
        isActive: t.isActive,
        hardware: t.hardware.map(hw => ({
          category: hw.category,
          name: hw.name,
          description: hw.description,
          icon: getIconName(hw.icon),
        })),
        accessories: t.accessories.map(acc => ({
          category: acc.category,
          name: acc.name,
          description: acc.description,
          icon: getIconName(acc.icon),
        })),
        features: t.features.map(f => ({
          text: f.text,
          icon: getIconName(f.icon),
        })),
      })),
      packages: packages.map(p => ({
        title: p.title,
        description: p.description,
        price: p.price,
        hasDiscount: p.hasDiscount,
        discountPrice: p.discountPrice,
      })),
    };

    try {
      await updateVenueSpecs({ venueId, specs: payload }).unwrap();
      toast.success(t('addSpecs.saveSuccess'));
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err?.data?.message || 'Xəta baş verdi. Yenidən yoxlayın.');
    }
  };

  // ══════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════
  if (isLoadingSpecs) {
    return (
      <div className="p-8 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-6 animate-pulse">
          <div className="w-20 h-20 bg-surface-container-low rounded-3xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">settings</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-on-surface-variant uppercase tracking-widest">{t('addSpecs.loading')}</h3>
            <p className="text-on-surface-variant/60 font-medium mt-1">{t('addSpecs.fetching')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // NO VENUE WARNING
  // ══════════════════════════════════════════════════════════
  if (!venueId && !isLoadingSpecs) {
    return (
      <div className="p-8 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-error/10 rounded-3xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-5xl text-error">warning</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-on-surface uppercase tracking-widest">{t('addSpecs.venueNotFound')}</h3>
            <p className="text-on-surface-variant font-medium mt-2">
              {t('addSpecs.createVenueFirst')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <>
      <div className="p-8 min-h-[calc(100vh-4rem)] bg-transparent space-y-8 animate-in fade-in zoom-in-95 duration-500">

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION: Wizard-Style Page Header                  */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[2rem] shadow-sm border border-surface-container-high dark:border-slate-800 relative overflow-hidden">
          {/* Form inputs */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">title</span>
                  {t('addSpecs.pageTitleLabel')}
                </label>
                <input
                  className="w-full bg-surface-container-low dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 rounded-2xl px-6 py-4 text-xl font-extrabold tracking-tight text-on-surface dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all outline-none placeholder:text-outline"
                  type="text"
                  placeholder={t('addSpecs.pageTitlePlaceholder')}
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">description</span>
                  {t('addSpecs.pageSubtitleLabel')}
                </label>
                <textarea
                  className="w-full bg-surface-container-low dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 rounded-2xl px-6 py-4 text-on-surface-variant dark:text-slate-300 text-base leading-relaxed focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all outline-none resize-none"
                  rows="2"
                  placeholder={t('addSpecs.pageSubtitlePlaceholder')}
                  value={pageSubtitle}
                  onChange={(e) => setPageSubtitle(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION: Add Tier Buttons (PC + Playstation)       */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => addTier('pc')}
            className="flex items-center gap-4 px-8 py-5 rounded-2xl font-bold transition-all cursor-pointer group shadow-xl bg-gradient-to-br from-primary to-primary-container text-white shadow-primary/20 hover:scale-[1.02] hover:shadow-2xl active:scale-95"
          >
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <BsPcDisplay className="text-2xl group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <span className="block text-base font-black">{t('addSpecs.addPcTier')}</span>
              <span className="block text-xs text-white/60 font-medium">Hardware, GPU, Monitor...</span>
            </div>
            <span className="material-symbols-outlined ml-auto text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all">arrow_forward</span>
          </button>

          <button
            onClick={() => addTier('playstation')}
            className="flex items-center gap-4 px-8 py-5 rounded-2xl font-bold transition-all cursor-pointer group shadow-xl bg-gradient-to-br from-[#003791] to-[#00439c] text-white shadow-[#003791]/20 hover:scale-[1.02] hover:shadow-2xl active:scale-95"
          >
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <FaPlaystation className="text-2xl group-hover:rotate-[360deg] transition-transform duration-700" />
            </div>
            <div className="text-left">
              <span className="block text-base font-black">{t('addSpecs.addPsTier')}</span>
              <span className="block text-xs text-white/60 font-medium">PS5, DualSense, VR...</span>
            </div>
            <span className="material-symbols-outlined ml-auto text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all">arrow_forward</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION: Tiers Accordion List                      */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="space-y-6">
          {tiers.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-surface-container-high dark:border-slate-800 rounded-[2rem] bg-gradient-to-b from-surface-container-lowest to-surface-container-low/30 dark:from-slate-900 dark:to-slate-800/30 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-20 h-20 bg-primary/5 dark:bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-5xl text-primary/30">stacks</span>
              </div>
              <h3 className="text-xl font-black text-on-surface-variant/50 dark:text-slate-600 uppercase tracking-widest">{t('addSpecs.noTiers')}</h3>
              <p className="text-on-surface-variant/40 dark:text-slate-500 font-medium mt-2 max-w-md mx-auto">{t('addSpecs.addTierDesc')}</p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => addTier('pc')} className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer">
                  <BsPcDisplay className="text-sm" /> PC Tier
                </button>
                <button onClick={() => addTier('playstation')} className="flex items-center gap-2 px-5 py-2.5 bg-[#003791]/10 text-[#003791] rounded-xl text-xs font-bold hover:bg-[#003791]/20 transition-all cursor-pointer">
                  <FaPlaystation className="text-sm" /> PS Tier
                </button>
              </div>
            </div>
          )}

          {tiers.map((tier) => (
            <div key={tier.id} className="bg-surface-container-lowest dark:bg-slate-900 rounded-[1.5rem] shadow-[0px_20px_40px_rgba(25,28,31,0.04)] overflow-hidden border border-surface-container-high dark:border-slate-800 animate-in slide-in-from-bottom-8 duration-500">
              {/* Gradient accent strip */}
              <div className={`h-1 ${tier.type === 'pc' ? 'bg-gradient-to-r from-primary to-primary-container' : 'bg-gradient-to-r from-[#003791] to-[#00439c]'}`}></div>
              {/* Tier Header (Collapsed View) */}
              <div
                className={`flex items-center justify-between p-6 cursor-pointer transition-colors ${expandedTierId === tier.id ? 'bg-surface-container-low/50 dark:bg-slate-800/50 border-b border-surface-container-high dark:border-slate-800' : 'hover:bg-surface-container-low/30 dark:hover:bg-slate-800/30'}`}
                onClick={() => setExpandedTierId(expandedTierId === tier.id ? null : tier.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Hero thumbnail */}
                  {tier.heroImage ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm border border-surface-container-high dark:border-slate-700 flex-shrink-0">
                      <img src={formatImageUrl(tier.heroImage)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-14 h-14 flex items-center justify-center rounded-xl shadow-sm flex-shrink-0 ${tier.type === 'pc' ? 'bg-primary/10 text-primary' : 'bg-[#003791]/10 text-[#003791]'}`}>
                      {renderIcon(tier.icon, "text-2xl")}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-on-surface dark:text-white leading-none">{tier.title || t('addSpecs.unnamedTier')}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${tier.type === 'pc' ? 'bg-primary/10 text-primary' : 'bg-[#003791]/10 text-[#003791]'}`}>{tier.type}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-on-surface-variant dark:text-slate-400 text-sm font-bold">{tier.price || '0.00'} AZN<span className="font-normal text-xs"> / {t('addSpecs.hourlyPrice')}</span></span>
                    </div>
                    {/* Item counts */}
                    <div className="flex items-center gap-2 mt-2">
                      {tier.type === 'pc' && tier.hardware?.length > 0 && (
                        <span className="text-[10px] font-bold bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">memory</span> {tier.hardware.length}
                        </span>
                      )}
                      {tier.type === 'pc' && tier.accessories?.length > 0 && (
                        <span className="text-[10px] font-bold bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">mouse</span> {tier.accessories.length}
                        </span>
                      )}
                      {tier.features?.length > 0 && (
                        <span className="text-[10px] font-bold bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">star</span> {tier.features.length}
                        </span>
                      )}
                      {!tier.heroImage && (
                        <span className="text-[10px] font-bold bg-error/10 text-error px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">image</span> Şəkil yoxdur
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTier(tier.id); }}
                    className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">delete</span>
                  </button>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-300 ${expandedTierId === tier.id ? 'rotate-180 bg-primary/10 text-primary' : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-xl">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Tier Expanded Content */}
              {expandedTierId === tier.id && (
                <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-300">

                  {/* ── 01. Ümumi Məlumatlar ── */}
                  <div className="grid grid-cols-12 gap-8 mb-12">
                    <div className="col-span-12">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">01</div>
                        <h4 className="text-base font-black text-on-surface dark:text-white">
                          {t('addSpecs.generalInfo')}
                        </h4>
                      </div>
                    </div>
                    <div className="col-span-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant ml-1">{t('addSpecs.tierTitleLabel')}</label>
                        <input
                          className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 transition-all font-medium text-on-surface dark:text-white"
                          type="text"
                          value={tier.title}
                          onChange={(e) => updateTier(tier.id, { title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant ml-1">{t('addSpecs.tierIconLabel')}</label>
                        <button
                          onClick={() => {
                            setActiveTierId(tier.id);
                            setIconModalTarget('tier');
                            setIsIconModalOpen(true);
                          }}
                          className="flex items-center justify-between w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-3 hover:bg-surface-container dark:hover:bg-slate-700 transition-all cursor-pointer group/icon"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tier.type === 'pc' ? 'bg-primary/10 text-primary' : 'bg-[#003791]/10 text-[#003791]'}`}>
                              {renderIcon(tier.icon)}
                            </div>
                            <span className="text-sm font-bold text-on-surface dark:text-white uppercase tracking-tight">{getIconName(tier.icon)}</span>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant group-hover/icon:text-primary transition-colors">edit</span>
                        </button>
                      </div>
                    </div>
                    <div className="col-span-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant ml-1">{t('addSpecs.priceLabel')}</label>
                        <input
                          className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 text-on-surface dark:text-white transition-all font-bold"
                          type="number"
                          value={tier.price}
                          onChange={(e) => updateTier(tier.id, { price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant ml-1">{t('addSpecs.shortSpecLabel')}</label>
                        <input
                          className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 text-on-surface dark:text-white transition-all font-medium"
                          type="text"
                          value={tier.shortSpec}
                          onChange={(e) => updateTier(tier.id, { shortSpec: e.target.value })}
                          placeholder={t('addSpecs.shortSpecPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── 02. Səviyyə Şəkli (Shared for both PC & PS) ── */}
                  <div className="mb-12 animate-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">02</div>
                      <h4 className="text-base font-black text-on-surface dark:text-white">
                        {t('addSpecs.heroImageTitle')}
                      </h4>
                    </div>

                    <div className="bg-surface-container-low dark:bg-slate-800/50 p-6 rounded-2xl border border-surface-container-high dark:border-slate-800 mb-8 animate-in zoom-in-95 duration-500">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <label className="w-full md:w-64 aspect-video rounded-xl bg-surface-container-highest overflow-hidden border-2 border-dashed border-outline-variant flex flex-col items-center justify-center group relative cursor-pointer hover:border-primary transition-all">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleTierHeroUpload(tier.id, e)} 
                            disabled={isUploadingMap[tier.id]}
                          />
                          {tier.heroImage ? (
                            <img alt="Tier Hero" className="w-full h-full object-cover" src={formatImageUrl(tier.heroImage)} />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-on-surface-variant/40">
                              <span className="material-symbols-outlined text-4xl mb-1">image</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">{t('addSpecs.noImage')}</span>
                            </div>
                          )}
                          
                          <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity ${isUploadingMap[tier.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isUploadingMap[tier.id] ? (
                              <span className="material-symbols-outlined text-white text-3xl animate-spin">progress_activity</span>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-white text-3xl mb-1">upload_file</span>
                                <span className="text-white text-[10px] font-bold uppercase tracking-widest">{tier.heroImage ? t('addSpecs.changeImage') : t('addSpecs.uploadImage')}</span>
                              </>
                            )}
                          </div>
                        </label>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                          <h5 className="text-sm font-bold text-on-surface dark:text-white">{t('addSpecs.venueView')}</h5>
                          <p className="text-[11px] text-on-surface-variant dark:text-slate-400 leading-relaxed">
                            {t('addSpecs.heroImageDesc')}
                          </p>
                          {tier.heroImage && (
                            <button 
                              onClick={() => updateTier(tier.id, { heroImage: '' })}
                              className="mt-2 text-xs font-bold text-error flex items-center gap-1 hover:underline cursor-pointer mx-auto md:mx-0"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              {t('addSpecs.deleteImage')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── 03. PC Details (Hardware + Accessories) — Hidden for PS ── */}
                  {tier.type === 'pc' && (
                    <div className="mb-12 animate-in slide-in-from-left-4 duration-500">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">03</div>
                        <h4 className="text-base font-black text-on-surface dark:text-white">
                          {t('addSpecs.pcDetailsTitle')}
                        </h4>
                      </div>


                      {/* Hardware + Accessories Grid */}
                      <div className="grid grid-cols-2 gap-12">
                        {/* Hardware */}
                        <div className="space-y-4 animate-in slide-in-from-left-8 duration-500">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase text-on-surface-variant">{t('addSpecs.hardwareTitle')}</p>
                            <button
                              onClick={() => {
                                setActiveTierId(tier.id);
                                setTempHardware({ category: 'Processor', name: '', description: '', icon: hardwareIcons[0] });
                                setIsHardwareModalOpen(true);
                              }}
                              className="p-1 hover:bg-primary/10 rounded-full text-primary cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 group"
                            >
                              <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">add</span> {t('addSpecs.add')}
                            </button>
                          </div>
                          <div className="space-y-3">
                            {tier.hardware.map((hw) => (
                              <div key={hw.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/50 border border-surface-container-high dark:border-slate-800 rounded-2xl group hover:border-primary/30 transition-all">
                                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                  {renderIcon(hw.icon)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-primary tracking-tighter">{hw.category}</span>
                                    <span className="w-1 h-1 bg-surface-container-highest rounded-full"></span>
                                    <span className="text-sm font-bold text-on-surface dark:text-white">{hw.name}</span>
                                  </div>
                                  <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5 line-clamp-1">{hw.description}</p>
                                </div>
                                <button
                                  onClick={() => updateTier(tier.id, { hardware: tier.hardware.filter(h => h.id !== hw.id) })}
                                  className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                              </div>
                            ))}
                            {tier.hardware.length === 0 && (
                              <div className="py-8 text-center border-2 border-dashed border-surface-container-high dark:border-slate-800 rounded-2xl text-on-surface-variant dark:text-slate-500">
                                <span className="material-symbols-outlined text-3xl opacity-20 block mb-1">memory</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">{t('addSpecs.empty')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Accessories */}
                        <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase text-on-surface-variant">{t('addSpecs.accessoriesTitle')}</p>
                            <button
                              onClick={() => {
                                setActiveTierId(tier.id);
                                setTempAccessory({ category: 'Mouse', name: '', description: '', icon: accessoryIcons[0] });
                                setIsAccessoryModalOpen(true);
                              }}
                              className="p-1 hover:bg-primary/10 rounded-full text-primary cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 group"
                            >
                              <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">add</span> {t('addSpecs.add')}
                            </button>
                          </div>
                          <div className="space-y-3">
                            {tier.accessories.map((acc) => (
                              <div key={acc.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/50 border border-surface-container-high dark:border-slate-800 rounded-2xl group hover:border-secondary/30 transition-all">
                                <div className="w-12 h-12 bg-secondary/5 rounded-xl flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                                  {renderIcon(acc.icon)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-secondary tracking-tighter">{acc.category}</span>
                                    <span className="w-1 h-1 bg-surface-container-highest rounded-full"></span>
                                    <span className="text-sm font-bold text-on-surface dark:text-white">{acc.name}</span>
                                  </div>
                                  <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5 line-clamp-1">{acc.description}</p>
                                </div>
                                <button
                                  onClick={() => updateTier(tier.id, { accessories: tier.accessories.filter(a => a.id !== acc.id) })}
                                  className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                              </div>
                            ))}
                            {tier.accessories.length === 0 && (
                              <div className="py-8 text-center border-2 border-dashed border-surface-container-high dark:border-slate-800 rounded-2xl text-on-surface-variant">
                                <span className="material-symbols-outlined text-3xl opacity-20 block mb-1">mouse</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">{t('addSpecs.empty')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 03 (or 02 for PS). Önə Çıxan Xüsusiyyətlər ── */}
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">{tier.type === 'pc' ? '04' : '03'}</div>
                        <h4 className="text-base font-black text-on-surface dark:text-white">
                          {t('addSpecs.featuredTitle')}
                        </h4>
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                          {tier.features.length}/3
                        </span>
                      </div>
                      {tier.features.length < 3 && (
                        <button
                          onClick={() => {
                            setActiveTierId(tier.id);
                            setTempFeature({ text: '', icon: 'star' });
                            setIsFeaturedModalOpen(true);
                          }}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 px-3 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">add</span>
                          {t('addSpecs.addFeature')}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {tier.features.map((spec) => (
                        <div key={spec.id} className="bg-white dark:bg-slate-800/50 border border-surface-container-high dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center gap-3 group relative hover:border-primary/30 transition-all">
                          <button
                            onClick={() => updateTier(tier.id, { features: tier.features.filter(f => f.id !== spec.id) })}
                            className="absolute top-2 right-2 w-7 h-7 bg-error/5 text-error rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-error hover:text-white cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tier.type === 'pc' ? 'bg-primary/5 text-primary' : 'bg-[#003791]/5 text-[#003791]'}`}>
                            {renderIcon(spec.icon, "text-2xl")}
                          </div>
                          <span className="text-xs font-bold text-on-surface dark:text-white leading-tight px-2">{spec.text}</span>
                        </div>
                      ))}
                      {tier.features.length === 0 && (
                        <div className="col-span-1 sm:col-span-2 md:col-span-3 py-12 text-center border-2 border-dashed border-surface-container-high dark:border-slate-800 rounded-[2rem] bg-surface-container-lowest/50 dark:bg-slate-900/50">
                          <div className="w-16 h-16 bg-surface-container-low dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-on-surface-variant/30">
                            <span className="material-symbols-outlined text-4xl">star_outline</span>
                          </div>
                          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em]">{t('addSpecs.featuredPlaceholder')}</p>
                          <p className="text-[10px] text-on-surface-variant/60 mt-2 italic">{t('addSpecs.featuredExamples')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION: Dynamic Special Packages                  */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-[2rem] shadow-[0px_25px_50px_rgba(0,0,0,0.06)] border border-surface-container-high dark:border-slate-800 p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-3xl">auto_awesome_motion</span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-on-surface dark:text-white leading-tight">{t('addSpecs.specialPackages')}</h2>
                <p className="text-on-surface-variant dark:text-slate-400 font-medium">{t('addSpecs.specialPackagesDesc')}</p>
              </div>
            </div>
            <button
              onClick={addPackage}
              className="flex items-center gap-2 bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer group"
            >
              <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
              <span>{t('addSpecs.addNewPackage')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`bg-surface-container-low dark:bg-slate-800/50 p-6 rounded-[1.5rem] border relative group hover:shadow-xl transition-all animate-in zoom-in-95 duration-300 ${pkg.hasDiscount ? 'border-primary/30 ring-2 ring-primary/10' : 'border-surface-container-high dark:border-slate-700 hover:border-primary/30'}`}>
                {/* Discount ribbon */}
                {pkg.hasDiscount && (
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-primary to-primary-container text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg shadow-primary/20 z-10 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">local_offer</span>
                    Endirimli
                  </div>
                )}
                <button
                  onClick={() => removePackage(pkg.id)}
                  className="absolute -top-3 -right-3 w-9 h-9 bg-white dark:bg-slate-700 shadow-xl text-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-error hover:text-white cursor-pointer -rotate-12 group-hover:rotate-0"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <input
                      className="w-full bg-transparent border-0 border-b border-surface-container-high dark:border-slate-700 p-0 pb-1 text-lg font-black focus:ring-0 focus:border-primary transition-all outline-none text-on-surface dark:text-white"
                      placeholder={t('addSpecs.packageTitlePlaceholder')}
                      type="text"
                      value={pkg.title}
                      onChange={(e) => updatePackage(pkg.id, { title: e.target.value })}
                    />
                    <textarea
                      className="w-full bg-transparent border-0 text-sm text-on-surface-variant dark:text-slate-400 p-0 resize-none focus:ring-0 leading-relaxed outline-none"
                      placeholder={t('addSpecs.packageDescPlaceholder')}
                      rows="2"
                      value={pkg.description}
                      onChange={(e) => updatePackage(pkg.id, { description: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Discount Toggle & Prices */}
                  <div className="space-y-4 pt-4 border-t border-surface-container-high/50 dark:border-slate-700">
                    <label className="flex items-center gap-3 cursor-pointer group/check">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={pkg.hasDiscount}
                          onChange={(e) => updatePackage(pkg.id, { hasDiscount: e.target.checked })}
                          className="peer sr-only"
                        />
                        <div className="w-10 h-6 bg-surface-container-highest dark:bg-slate-700 rounded-full peer-checked:bg-primary transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white dark:bg-slate-300 rounded-full transition-all peer-checked:left-5"></div>
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400 group-hover/check:text-primary transition-colors uppercase tracking-widest">{t('addSpecs.discountedPrice')}</span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-on-surface-variant/60 dark:text-slate-500 ml-1">{t('addSpecs.normalPrice')}</span>
                        <div className="flex items-center bg-white dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 rounded-xl px-3 py-2">
                          <input
                            className="bg-transparent border-0 w-full text-sm font-bold text-on-surface dark:text-white focus:ring-0 p-0 outline-none"
                            type="number"
                            value={pkg.price}
                            onChange={(e) => updatePackage(pkg.id, { price: e.target.value })}
                            placeholder="0"
                          />
                          <span className="text-[10px] font-bold text-on-surface-variant dark:text-slate-500">AZN</span>
                        </div>
                      </div>

                      <div className={`space-y-1 transition-all duration-300 ${pkg.hasDiscount ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                        <span className="text-[10px] font-black uppercase text-primary/60 ml-1">{t('addSpecs.discountedPrice')}</span>
                        <div className="flex items-center bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 ring-2 ring-primary/5">
                          <input
                            className="bg-transparent border-0 w-full text-sm font-black text-primary focus:ring-0 p-0 outline-none"
                            type="number"
                            value={pkg.discountPrice}
                            onChange={(e) => updatePackage(pkg.id, { discountPrice: e.target.value })}
                            placeholder="0"
                          />
                          <span className="text-[10px] font-bold text-primary">AZN</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty Add Placeholder */}
            <button
              onClick={addPackage}
              className="border-2 border-dashed border-surface-container-high dark:border-slate-800 rounded-[1.5rem] flex flex-col items-center justify-center gap-4 p-8 text-on-surface-variant dark:text-slate-500 hover:bg-surface-container-low dark:hover:bg-slate-800 hover:border-primary/50 transition-all cursor-pointer min-h-[250px] group"
            >
              <div className="w-16 h-16 rounded-3xl bg-surface-container-high dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <div className="text-center">
                <span className="text-xs font-black uppercase tracking-[0.2em] block">{t('addSpecs.newPackage')}</span>
                <span className="text-[10px] font-medium opacity-60">{t('addSpecs.newPackageDesc')}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Spacer for sticky footer */}
        <div className="h-24"></div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Sticky Save Footer                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-surface-container-high dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="max-w-[calc(100%-280px)] ml-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400">
              <span className="material-symbols-outlined text-lg text-primary">layers</span>
              <span className="text-sm font-bold">{tiers.length} Tier</span>
            </div>
            <div className="w-px h-5 bg-surface-container-high dark:bg-slate-700"></div>
            <div className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400">
              <span className="material-symbols-outlined text-lg text-primary">inventory_2</span>
              <span className="text-sm font-bold">{packages.length} Paket</span>
            </div>
            <div className="w-px h-5 bg-surface-container-high dark:bg-slate-700"></div>
            <div className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400">
              <span className="material-symbols-outlined text-lg text-primary">memory</span>
              <span className="text-sm font-bold">{tiers.reduce((sum, t) => sum + (t.hardware?.length || 0) + (t.accessories?.length || 0), 0)} Avadanlıq</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-3.5 bg-gradient-to-r from-primary to-primary-container text-white text-base font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-3 group disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span>{t('addSpecs.saving')}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">save</span>
                <span>{t('addSpecs.saveAll')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL: Icon Picker                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      {isIconModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsIconModalOpen(false)}></div>
          <div className="bg-surface-container-lowest dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-surface-container-high dark:border-slate-800 relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-on-surface dark:text-white uppercase tracking-tight">{t('addSpecs.iconLibrary')}</h2>
                <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium mt-1">{t('addSpecs.iconLibraryDesc')}</p>
              </div>
              <button onClick={() => setIsIconModalOpen(false)} className="w-12 h-12 rounded-2xl bg-surface-container-low dark:bg-slate-800 flex items-center justify-center text-on-surface-variant dark:text-slate-400 hover:bg-error hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-8 mb-6">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
                <input
                  type="text"
                  placeholder={t('addSpecs.searchIcon')}
                  value={iconSearchQuery}
                  onChange={(e) => setIconSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border border-surface-container-high dark:border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-on-surface dark:text-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="px-8 pb-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {Object.entries(filteredIcons).map(([category, icons]) => (
                <div key={category} className="mb-8">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 ml-1">{category}</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {icons.map((icon, idx) => (
                      <button
                        key={getIconKey(icon, idx)}
                        onClick={() => {
                          if (iconModalTarget === 'tier' && activeTierId) {
                            updateTier(activeTierId, { icon });
                          } else {
                            setTempFeature(prev => ({ ...prev, icon }));
                          }
                          setIsIconModalOpen(false);
                          setIconSearchQuery('');
                        }}
                        className={`aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl transition-all cursor-pointer group ${
                          (iconModalTarget === 'tier'
                            ? getIconName(activeTierId ? tiers.find(t => t.id === activeTierId)?.icon : '')
                            : getIconName(tempFeature.icon)) === getIconName(icon)
                          ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20'
                          : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 hover:bg-primary/5 hover:text-primary transition-colors'
                        }`}
                      >
                        <div className="group-hover:scale-125 transition-transform">
                          {renderIcon(icon, "text-2xl")}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-60 truncate w-full px-1 text-center font-mono">
                          {getIconName(icon).replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(filteredIcons).length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-surface-container-low rounded-3xl flex items-center justify-center mx-auto text-on-surface-variant/40">
                    <span className="material-symbols-outlined text-4xl">search_off</span>
                  </div>
                  <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">{t('addSpecs.noIconFound')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL: Hardware Add                                */}
      {/* ═══════════════════════════════════════════════════ */}
      {isHardwareModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsHardwareModalOpen(false)}></div>
          <div className="bg-surface-container-lowest dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-surface-container-high dark:border-slate-800 relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-surface-container-high dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-on-surface dark:text-white uppercase tracking-tight">{t('addSpecs.addHardware')}</h3>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 font-medium mt-1">{t('addSpecs.hardwareDesc')}</p>
              </div>
              <button onClick={() => setIsHardwareModalOpen(false)} className="w-10 h-10 rounded-xl bg-surface-container-low dark:bg-slate-800 flex items-center justify-center hover:bg-error hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">Kateqoriya</label>
                    <select
                      value={tempHardware.category}
                      onChange={(e) => setTempHardware({...tempHardware, category: e.target.value})}
                      className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-3.5 text-sm font-bold text-on-surface dark:text-white focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                    >
                    {hardwareCategories.map(cat => <option key={cat} value={cat} className="dark:bg-slate-900">{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">İkon Seçimi</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {hardwareIcons.map(icon => (
                        <button
                          key={icon.name}
                          onClick={() => setTempHardware({...tempHardware, icon})}
                          className={`w-11 h-11 min-w-[2.75rem] rounded-xl flex items-center justify-center transition-all cursor-pointer ${getIconName(tempHardware.icon) === icon.name ? 'bg-primary text-white shadow-lg' : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 hover:bg-primary/5 hover:text-primary'}`}
                        >
                        {renderIcon(icon, "text-xl")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">{t('addSpecs.hardwareNameLabel', { category: tempHardware.category })}</label>
                <input
                  type="text"
                  value={tempHardware.name}
                  onChange={(e) => setTempHardware({...tempHardware, name: e.target.value})}
                  placeholder={t('addSpecs.hardwareNamePlaceholder', { category: tempHardware.category })}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-4 text-sm font-bold text-on-surface dark:text-white focus:ring-4 focus:ring-primary/10 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">{t('addSpecs.hardwareDescLabel')}</label>
                <textarea
                  rows="3"
                  value={tempHardware.description}
                  onChange={(e) => setTempHardware({...tempHardware, description: e.target.value})}
                  placeholder={t('addSpecs.hardwareDescPlaceholder')}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-4 text-sm font-medium text-on-surface dark:text-white focus:ring-4 focus:ring-primary/10 outline-none resize-none"
                ></textarea>
              </div>

              <button
                onClick={addHardwareToTier}
                disabled={!tempHardware.name.trim()}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 cursor-pointer disabled:opacity-50 disabled:scale-100"
              >
                {t('addSpecs.addHardware')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL: Accessory Add                               */}
      {/* ═══════════════════════════════════════════════════ */}
      {isAccessoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAccessoryModalOpen(false)}></div>
          <div className="bg-surface-container-lowest dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-surface-container-high dark:border-slate-800 relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-surface-container-high dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-on-surface dark:text-white uppercase tracking-tight text-secondary">{t('addSpecs.addAccessory')}</h3>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 font-medium mt-1">{t('addSpecs.accessoryDesc')}</p>
              </div>
              <button onClick={() => setIsAccessoryModalOpen(false)} className="w-10 h-10 rounded-xl bg-surface-container-low dark:bg-slate-800 flex items-center justify-center hover:bg-error hover:text-white transition-all cursor-pointer text-on-surface-variant dark:text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">Kateqoriya</label>
                  <select
                    value={tempAccessory.category}
                    onChange={(e) => setTempAccessory({...tempAccessory, category: e.target.value})}
                    className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-3.5 text-sm font-bold text-on-surface dark:text-white focus:ring-4 focus:ring-secondary/10 transition-all outline-none appearance-none cursor-pointer"
                  >
                    {accessoryCategories.map(cat => <option key={cat} value={cat} className="dark:bg-slate-900">{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">İkon Seçimi</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {accessoryIcons.map(icon => (
                      <button
                        key={icon.name}
                        onClick={() => setTempAccessory({...tempAccessory, icon})}
                        className={`w-11 h-11 min-w-[2.75rem] rounded-xl flex items-center justify-center transition-all cursor-pointer ${getIconName(tempAccessory.icon) === icon.name ? 'bg-secondary text-white shadow-lg shadow-secondary/30' : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 hover:bg-secondary/5 hover:text-secondary'}`}
                      >
                        {renderIcon(icon, "text-xl")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">{t('addSpecs.accessoryNameLabel', { category: tempAccessory.category })}</label>
                <input
                  type="text"
                  value={tempAccessory.name}
                  onChange={(e) => setTempAccessory({...tempAccessory, name: e.target.value})}
                  placeholder={t('addSpecs.accessoryNamePlaceholder', { category: tempAccessory.category })}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-4 text-sm font-bold text-on-surface dark:text-white focus:ring-4 focus:ring-secondary/10 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">{t('addSpecs.accessoryDescLabel')}</label>
                <textarea
                  rows="3"
                  value={tempAccessory.description}
                  onChange={(e) => setTempAccessory({...tempAccessory, description: e.target.value})}
                  placeholder={t('addSpecs.accessoryDescPlaceholder')}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-4 text-sm font-medium text-on-surface dark:text-white focus:ring-4 focus:ring-secondary/10 outline-none resize-none"
                ></textarea>
              </div>

              <button
                onClick={addAccessoryToTier}
                disabled={!tempAccessory.name.trim()}
                className="w-full py-4 bg-secondary text-white font-black rounded-2xl shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 cursor-pointer disabled:opacity-50 disabled:scale-100"
              >
                {t('addSpecs.addAccessory')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL: Featured Spec Add                           */}
      {/* ═══════════════════════════════════════════════════ */}
      {isFeaturedModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsFeaturedModalOpen(false)}></div>
          <div className="bg-surface-container-lowest dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-surface-container-high dark:border-slate-800 relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-surface-container-high dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-on-surface dark:text-white uppercase tracking-tight">{t('addSpecs.featuredModalTitle')}</h3>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 font-medium mt-1">{t('addSpecs.featuredModalDesc')}</p>
              </div>
              <button onClick={() => setIsFeaturedModalOpen(false)} className="w-10 h-10 rounded-xl bg-surface-container-low dark:bg-slate-800 flex items-center justify-center hover:bg-error hover:text-white transition-all cursor-pointer text-on-surface-variant dark:text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">{t('addSpecs.iconSelection')}</label>
                <button
                  onClick={() => { setIconModalTarget('feature'); setIsIconModalOpen(true); }}
                  className="w-full flex items-center gap-4 p-4 bg-surface-container-low dark:bg-slate-800 border border-dashed border-primary/30 dark:border-slate-700 rounded-2xl hover:bg-primary/5 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    {renderIcon(tempFeature.icon, "text-2xl")}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-xs font-black uppercase text-primary tracking-widest">{t('addSpecs.pickFromLibrary')}</span>
                    <p className="text-[10px] text-on-surface-variant dark:text-slate-500 mt-0.5">{t('addSpecs.selectedIcon', { icon: getIconName(tempFeature.icon) })}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-500">chevron_right</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1">{t('addSpecs.featureNameLabel')}</label>
                <input
                  type="text"
                  maxLength="25"
                  value={tempFeature.text}
                  onChange={(e) => setTempFeature({...tempFeature, text: e.target.value})}
                  placeholder={t('addSpecs.featureNamePlaceholder')}
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-0 rounded-xl px-4 py-4 text-sm font-bold text-on-surface dark:text-white focus:ring-4 focus:ring-primary/10 outline-none"
                />
                <div className="flex justify-between px-1">
                  <span className="text-[9px] text-on-surface-variant font-bold opacity-30 italic">{t('addSpecs.maxChars')}</span>
                  <span className="text-[9px] text-on-surface-variant font-bold">{tempFeature.text.length}/25</span>
                </div>
              </div>

              <button
                onClick={addFeatureToTier}
                disabled={!tempFeature.text.trim()}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-6 cursor-pointer disabled:opacity-50 disabled:scale-100"
              >
                {t('addSpecs.addFeature')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddSpecs;

