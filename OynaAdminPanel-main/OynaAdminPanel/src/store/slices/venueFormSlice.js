import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Venue ID from backend after Step 1 creation
  currentVenueId: null,

  // Step 1: General Info
  logo: '',
  name: '',
  category: '',
  slogan: '',
  description: '',
  location: { type: 'Point', coordinates: [49.8671, 40.4093], city: '', address: '' },
  branches: [],

  // Step 2: Media & Pricing
  heroImage: null,
  gallery: [],
  basePrice: 12.50,
  peakPricingEnabled: false,
  amenities: [],

  // Step 3: Calendar & Config
  schedule: [
    { label: 'common.days.mon', isOpen: true, open: '09:00', close: '22:00' },
    { label: 'common.days.tue', isOpen: true, open: '09:00', close: '22:00' },
    { label: 'common.days.wed', isOpen: true, open: '09:00', close: '22:00' },
    { label: 'common.days.thu', isOpen: true, open: '09:00', close: '22:00' },
    { label: 'common.days.fri', isOpen: true, open: '09:00', close: '02:00' },
    { label: 'common.days.sat', isOpen: true, open: '10:00', close: '02:00' },
    { label: 'common.days.sun', isOpen: false, open: '10:00', close: '22:00' },
  ],
  contact: { phone: '', email: '', instagram: '', whatsapp: '', website: '' },
  bookingRules: { minTimeMinutes: 60, maxTimeMinutes: 480, gracePeriod: 15 },
  operatingHours: null,
};

const defaultLocation = { type: 'Point', coordinates: [49.8671, 40.4093], city: '', address: '' };

const normalizeLocation = (location) => {
  if (!location) return defaultLocation;

  if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    return {
      type: 'Point',
      coordinates: [location.coordinates[0], location.coordinates[1]],
      city: location.city || '',
      address: location.address || '',
    };
  }

  if (typeof location.lng === 'number' && typeof location.lat === 'number') {
    return {
      type: 'Point',
      coordinates: [location.lng, location.lat],
      city: location.city || '',
      address: location.address || '',
    };
  }

  return {
    ...defaultLocation,
    ...location,
  };
};

const venueFormSlice = createSlice({
  name: 'venueForm',
  initialState,
  reducers: {
    // Step 1 data
    setStep1: (state, action) => {
      const { logo, name, category, slogan, description, location, branches } = action.payload;
      state.logo = logo;
      state.name = name;
      state.category = category;
      state.slogan = slogan;
      state.description = description;
      state.location = location;
      state.branches = branches;
    },

    // After API creation, store the ID
    setCurrentVenueId: (state, action) => {
      state.currentVenueId = action.payload;
    },

    // Step 2 data
    setStep2: (state, action) => {
      const { heroImage, gallery, basePrice, peakPricingEnabled, amenities } = action.payload;
      state.heroImage = heroImage;
      state.gallery = gallery;
      state.basePrice = basePrice;
      if (peakPricingEnabled !== undefined) state.peakPricingEnabled = peakPricingEnabled;
      if (amenities !== undefined) state.amenities = amenities;
    },

    // Step 3 data
    setStep3: (state, action) => {
      const { schedule, contact, bookingRules } = action.payload;
      state.schedule = schedule;
      state.contact = contact;
      state.bookingRules = bookingRules;
    },

    // Load an existing venue for editing
    loadVenueForEdit: (state, action) => {
      const venue = action.payload;
      state.currentVenueId = venue._id;

      // Step 1
      state.logo = venue.logo || '';
      state.name = venue.name || '';
      state.category = venue.category || '';
      state.slogan = venue.slogan || '';
      state.description = venue.description || '';
      state.location = normalizeLocation(venue.location);
      state.branches = venue.branches || [];

      // Step 2
      state.heroImage = venue.media?.heroImage || null;
      state.gallery = venue.media?.gallery || [];
      state.basePrice = venue.pricing?.basePrice || 12.50;
      state.peakPricingEnabled = venue.pricing?.peakPricingEnabled || false;
      state.amenities = venue.amenities || [];

      // Step 3
      state.operatingHours = venue.operatingHours || null;
      if (venue.operatingHours?.schedule) {
        const scheduleEntries = venue.operatingHours.schedule;
        const dayMap = [
          { key: 'monday', label: 'common.days.mon' },
          { key: 'tuesday', label: 'common.days.tue' },
          { key: 'wednesday', label: 'common.days.wed' },
          { key: 'thursday', label: 'common.days.thu' },
          { key: 'friday', label: 'common.days.fri' },
          { key: 'saturday', label: 'common.days.sat' },
          { key: 'sunday', label: 'common.days.sun' },
        ];

        state.schedule = dayMap.map(({ key, label }) => {
          const day = scheduleEntries[key] || {};
          return {
            label,
            isOpen: !day.closed,
            open: day.open || '09:00',
            close: day.close || '22:00',
          };
        });
      }
      if (venue.contact) {
        state.contact = { ...state.contact, ...venue.contact };
      }
      if (venue.bookingRules) {
        state.bookingRules = {
          ...state.bookingRules,
          minTimeMinutes: venue.bookingRules.minTimeMinutes ?? state.bookingRules.minTimeMinutes,
          maxTimeMinutes: venue.bookingRules.maxTimeMinutes ?? state.bookingRules.maxTimeMinutes,
          gracePeriod: venue.bookingRules.gracePeriod ?? state.bookingRules.gracePeriod,
        };
      }
    },

    // Reset the whole form after completion
    resetVenueForm: () => ({ ...initialState, location: { ...defaultLocation } }),
  },
});

export const {
  setStep1,
  setCurrentVenueId,
  setStep2,
  setStep3,
  loadVenueForEdit,
  resetVenueForm,
} = venueFormSlice.actions;

export default venueFormSlice.reducer;
