const mongoose = require('mongoose');
const { Types } = mongoose;

const MONGO_URI = 'mongodb://localhost:27017/oyna-admin';

const venueSchema = new mongoose.Schema({
  status: { type: String, default: 'PUBLISHED' },
  adminId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: String,
  category: String,
  slogan: String,
  description: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    city: String,
    address: String,
  },
  branches: [String],
  media: Object,
  pricing: Object,
  amenities: [String],
  operatingHours: Object,
  contact: Object,
  bookingRules: Object,
  specs: Object,
});

const Venue = mongoose.model('Venue', venueSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  // Mövcud bir admin tapaq və ya təsadüfi yaradaq
  const Admin = mongoose.model('Admin', new mongoose.Schema({}));
  let admin = await Admin.findOne();
  let adminId;
  if (admin) {
    adminId = admin._id;
  } else {
    adminId = new Types.ObjectId();
  }

  const venues = [];
  for (let i = 1; i <= 200; i++) {
    venues.push({
      status: 'PUBLISHED',
      adminId: adminId,
      name: `Performance Venue ${i}`,
      category: 'Playstation Club',
      slogan: 'Best gaming experience',
      description: 'A very nice venue for testing performance with lots of text to simulate a real-world scenario. '.repeat(5),
      location: {
        type: 'Point',
        // Bakı ətrafında random koordinatlar
        coordinates: [49.8671 + (Math.random() * 0.1 - 0.05), 40.4093 + (Math.random() * 0.1 - 0.05)], 
        city: 'Baku',
        address: `Test Street ${i}`,
      },
      branches: ['Branch 1', 'Branch 2'],
      media: {
        heroImage: { url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', isPrimary: true, type: 'IMAGE' },
        gallery: [
          { url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', isPrimary: false, type: 'IMAGE' },
          { url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', isPrimary: false, type: 'IMAGE' },
          { url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', isPrimary: false, type: 'IMAGE' },
          { url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', isPrimary: false, type: 'IMAGE' }
        ]
      },
      pricing: {
        basePrice: Math.floor(Math.random() * 10) + 10,
        peakPricingEnabled: Math.random() > 0.5
      },
      amenities: ['WiFi', 'Kondisioner', 'PS5', 'VIP Otaq', 'Snack Bar', 'Otopark'],
      operatingHours: {
        is24_7: false,
        schedule: {
          monday: { open: '10:00', close: '23:00', closed: false, isNextDay: false },
          tuesday: { open: '10:00', close: '23:00', closed: false, isNextDay: false },
          wednesday: { open: '10:00', close: '23:00', closed: false, isNextDay: false },
          thursday: { open: '10:00', close: '23:00', closed: false, isNextDay: false },
          friday: { open: '10:00', close: '00:00', closed: false, isNextDay: true },
          saturday: { open: '10:00', close: '00:00', closed: false, isNextDay: true },
          sunday: { open: '10:00', close: '23:00', closed: false, isNextDay: false }
        }
      },
      contact: {
        phone: '+994501234567',
        email: `contact${i}@testvenue.com`,
        instagram: '@testvenue',
        whatsapp: '+994501234567',
        website: 'https://testvenue.com'
      },
      bookingRules: {
        minTimeMinutes: 60,
        maxTimeMinutes: 480,
        gracePeriod: 15
      },
      specs: {
        pageTitle: `Specs for Venue ${i}`,
        pageSubtitle: 'Top tier equipment',
        tiers: [
          {
            type: 'playstation',
            title: 'PS5 Standard',
            price: 5,
            shortSpec: 'PS5 + 2 DualSense',
            icon: 'ps5-icon',
            isActive: true,
            heroImage: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
            hardware: [],
            accessories: [],
            features: []
          }
        ],
        packages: []
      }
    });
  }

  await Venue.insertMany(venues);
  console.log('Successfully inserted 200 venues into local DB!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
