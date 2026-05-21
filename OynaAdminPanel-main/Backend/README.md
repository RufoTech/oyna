# OynaAdminPanel — Backend API

NestJS + MongoDB + JWT ilə yazılmış REST API. Venue idarəetmə sistemi üçün autentifikasiya və CRUD əməliyyatları təmin edir.

---

## Stack

| Texnologiya | Versiya | Məqsəd |
|---|---|---|
| NestJS | ^11 | Framework |
| MongoDB / Mongoose | ^9 | Verilənlər bazası |
| @nestjs/jwt | ^11 | JWT token idarəetməsi |
| bcryptjs | ^3 | Şifrə hash-ləməsi |
| @nestjs/config | ^4 | Mühit dəyişənləri |

---

## Qurulum

### 1. Asılılıqları quraşdır

```bash
npm install
```

### 2. `.env` faylı yarat

`Backend/` qovluğunda `.env` faylı yarat:

```env
MONGO_URI=mongodb://localhost:27017/oyna-admin
JWT_SECRET=OYNA_SUPER_SECRET_KEY_123!@
PORT=3000
```

### 3. Serveri işə sal

```bash
# Development (hot-reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server `http://localhost:3000` ünvanında işləyir.

---

## Autentifikasiya

- **Metod:** Bearer Token (JWT)
- **Müddət:** 12 saat
- **Header:** `Authorization: Bearer <access_token>`

İlk işə salındıqda default admin avtomatik yaradılır:
- **Email:** `admin@oyna.com`
- **Şifrə:** `admin123`

---

## API Endpointlər

### Auth

| Metod | Endpoint | Auth | Təsvir |
|---|---|---|---|
| POST | `/auth/login` | Yox | Sistemə daxil ol |

**POST `/auth/login`**
```json
// Request body
{ "email": "admin@oyna.com", "password": "admin123" }

// Response 200
{
  "access_token": "eyJhbGci...",
  "user": { "email": "admin@oyna.com", "displayName": "Admin User" }
}
```

---

### Venues

Bütün venue endpointləri JWT tələb edir.

| Metod | Endpoint | Təsvir |
|---|---|---|
| POST | `/venues` | Yeni venue yarat (Step 1) |
| GET | `/venues` | Bütün venueları siyahıla |
| GET | `/venues/shared/branches` | Filial adlarını al |
| GET | `/venues/:id` | Tək venue al |
| PATCH | `/venues/:id` | Venue yenilə (Step 2 / Step 3) |
| DELETE | `/venues/:id` | Venue sil |

---

## Venue Yaratma İş Axını (3 Addım)

### Step 1 — Ümumi məlumat (POST `/venues`)

```json
{
  "name": "Oyna Club",
  "category": "Playstation Club",
  "slogan": "Ən yaxşı oyun mərkəzi",
  "description": "Baku şəhərinin mərkəzində...",
  "location": {
    "city": "Bakı",
    "address": "Neftçilər pr. 12",
    "lat": 40.4093,
    "lng": 49.8671
  },
  "branches": ["Nərimanov", "Yasamal"]
}
```

Cavab: `{ "_id": "...", "status": "DRAFT", ... }`

---

### Step 2 — Media və qiymət (PATCH `/venues/:id`)

```json
{
  "media": {
    "heroImage": ["https://res.cloudinary.com/..."],
    "gallery": ["https://res.cloudinary.com/...", "..."]
  },
  "pricing": {
    "basePrice": 15,
    "peakPricingEnabled": false
  }
}
```

---

### Step 3 — Təqvim, əlaqə, nəşr (PATCH `/venues/:id`)

```json
{
  "operatingHours": {
    "is24_7": false,
    "schedule": {
      "monday":    { "open": "10:00", "close": "23:00", "closed": false },
      "tuesday":   { "open": "10:00", "close": "23:00", "closed": false },
      "wednesday": { "open": "10:00", "close": "23:00", "closed": false },
      "thursday":  { "open": "10:00", "close": "23:00", "closed": false },
      "friday":    { "open": "10:00", "close": "00:00", "closed": false },
      "saturday":  { "open": "10:00", "close": "00:00", "closed": false },
      "sunday":    { "open": "10:00", "close": "23:00", "closed": false }
    }
  },
  "contact": {
    "phone": "+994501234567",
    "email": "info@oynaclub.az",
    "instagram": "@oynaclub",
    "whatsapp": "+994501234567",
    "website": "https://oynaclub.az"
  },
  "bookingRules": {
    "minTime": "1 saat",
    "maxTime": "8 saat",
    "gracePeriod": 15
  },
  "amenities": ["WiFi", "Kondisioner", "Meşğul zonaları"],
  "status": "PUBLISHED"
}
```

---

## Verilənlər Bazası Modelləri

### User

| Sahə | Tip | Tələb | Təsvir |
|---|---|---|---|
| `email` | String | Bəli (unikal) | Admin email |
| `passwordHash` | String | Bəli | bcrypt hash |
| `displayName` | String | Xeyr | Görüntü adı |
| `createdAt` | Date | Auto | Yaradılma tarixi |
| `updatedAt` | Date | Auto | Yenilənmə tarixi |

### Venue

| Sahə | Tip | Default | Təsvir |
|---|---|---|---|
| `status` | String | `DRAFT` | `DRAFT` \| `PUBLISHED` |
| `adminId` | String | — | Sahibin JWT sub-u |
| `name` | String | — | Venue adı |
| `category` | String | — | `Playstation Club` \| `İnternet Kafe` \| `Karaoke` |
| `slogan` | String | — | Qısa şüar |
| `description` | String | — | Ətraflı təsvir |
| `location` | Object | — | `{ city, address, lat, lng }` |
| `branches` | String[] | — | Filial adları |
| `media` | Object | — | `{ heroImage: string[], gallery: string[] }` |
| `pricing` | Object | — | `{ basePrice: number, peakPricingEnabled: boolean }` |
| `amenities` | String[] | — | Xidmət adları |
| `operatingHours` | Object | — | `{ is24_7: boolean, schedule: {...} }` |
| `contact` | Object | — | `{ phone, email, instagram, whatsapp, website }` |
| `bookingRules` | Object | — | `{ minTime: string, maxTime: string, gracePeriod: number }` |
| `createdAt` | Date | Auto | — |
| `updatedAt` | Date | Auto | — |

---

## Layihə Strukturu

```
src/
├── main.ts                       # Giriş nöqtəsi (bootstrap)
├── app.module.ts                 # Kök modul (Config + MongoDB)
├── auth/
│   ├── auth.module.ts            # JWT + User modulu
│   ├── auth.controller.ts        # POST /auth/login
│   ├── auth.service.ts           # validateUser, login, admin seed
│   ├── jwt-auth.guard.ts         # Bearer token yoxlama
│   └── schemas/
│       └── user.schema.ts        # User Mongoose sxemi
└── venues/
    ├── venues.module.ts          # Venue modulu
    ├── venues.controller.ts      # CRUD endpointlər
    ├── venues.service.ts         # Biznes məntiq
    └── schemas/
        └── venue.schema.ts       # Venue Mongoose sxemi
```

---

## Xəta Kodları

| Kod | Səbəb |
|---|---|
| 401 | Token yoxdur, etibarsız və ya vaxtı bitib |
| 401 | Yanlış email / şifrə |
| 404 | Venue tapılmadı və ya bu admina aid deyil |
| 500 | Server xətası |
