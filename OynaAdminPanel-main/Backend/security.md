# Backend Təhlükəsizlik Analizi

**Tarix:** 2026-05-27  
**Stack:** NestJS 11 + MongoDB (Mongoose 9) + Redis + Socket.IO + Firebase FCM

---

## Əvvəlcədən Müəyyən Olunmuş 10 Problem

| # | Problem | Ciddilik |
|---|---------|----------|
| 1 | Public Reservations — Anonim IDOR/BOLA | 🟥 Kritik |
| 2 | Uploads — Anonim şəkil yükləmə | 🟥 Kritik |
| 3 | Venues/Foods — Rol yoxlanışı yoxdur | 🟧 Yüksək |
| 4 | Reservations — Admin IDOR | 🟧 Yüksək |
| 5 | CORS/JWT 10 il | 🟨 Orta |
| 6 | Google Login — Token doğrulaması yoxdur | 🟥 Kritik |
| 7 | OTP Brute Force qorunması yoxdur | 🟧 Yüksək |
| 8 | WebSocket — Autentifikasiya yoxdur | 🟧 Yüksək |
| 9 | User Enumeration | 🟨 Orta |
| 10 | Şifrə mürəkkəbliyi yoxdur | 🟨 Orta |

---

## Yeni Tapılan Əlavə Problemlər

### 11. 🟧 DRAFT məkanlar public endpoint-də sızır
**Fayl:** `src/venues/venues.service.ts:135, 160, 228`

Həm `findAllPublic`, həm də `findAllPublicPaginated` metodlarında status filtri:
```ts
status: { $in: ['ACTIVE', 'DRAFT', 'PUBLISHED', 'INACTIVE'] }
```
`DRAFT` statuslu məkanlar hələ admin tərəfindən tamamlanmamış məkanlardır. İctimai endpoint-lərdə görsənməməlidir.

**Tövsiyə:** Public endpoint-lərdə yalnız `['ACTIVE', 'PUBLISHED']` statuslarını qaytarın.

---

### 12. 🟧 Rezervasiya `updateStatus` — Admin IDOR (əlavə detal)
**Fayl:** `src/reservations/reservations.controller.ts:68-135`

`@Patch(':id/status')` endpoint-ində admin-in identity-si `@Req()` vasitəsilə alınmır və rezervasiyanın onun məkanına aid olub-olmadığı yoxlanılmır. Hər hansı bir admin JWT token-i ilə istənilən məkandakı istənilən rezervasiyanın statusunu dəyişə bilər.

Müqayisə üçün, `checkIn` metodunda bu yoxlama **var**:
```ts
const venues = await this.venuesService.findAll(adminId);
const hasVenue = venues.some(v => v._id.toString() === body.venueId);
```
Amma `updateStatus` metodunda **yoxdur**.

**Tövsiyə:** `updateStatus`-a `@Req() req: AuthRequest` əlavə edin, rezervasiyanın `venueId`-sini admin-in məkanları ilə müqayisə edin.

---

### 13. 🟨 Cloudinary xəta mesajı sızması
**Fayl:** `src/uploads/uploads.controller.ts:63`

```ts
throw new BadRequestException('Cloudinary upload failed: ' + error.message);
```

Cloudinary-dən gələn xəta mesajı birbaşa istifadəçiyə göstərilir. Bu, daxili API konfiqurasiyası, endpoint URL-ləri və digər həssas detalları ifşa edə bilər.

**Tövsiyə:** Generic xəta mesajı qaytarın, əsl xətanı yalnız server loqunda saxlayın:
```ts
this.logger.error(`Cloudinary upload failed: ${error.message}`);
throw new BadRequestException('Şəkil yükləmə uğursuz oldu.');
```

---

### 14. 🟨 Security headers (Helmet) yoxdur
**Fayl:** `src/main.ts`

`main.ts`-də helmet middleware qoşulmayıb. Aşağıdakı header-lər çatışmır:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `X-XSS-Protection`

**Tövsiyə:** `helmet` paketini əlavə edin:
```bash
npm install helmet
```
```ts
import helmet from 'helmet';
app.use(helmet());
```

---

### 15. 🟨 JWT token blacklisting yoxdur
**Fayl:** `src/auth/auth.module.ts:19` — `expiresIn: '3650d'`

JWT token-in TTL-i 10 ildir. Admin və ya istifadəçi silinsə belə, onların token-i 10 il keçərli qalır. Token revocation mexanizmi yoxdur.

**Tövsiyə:** İki seçim:
- **Redis blacklist:** Silinmiş istifadəçilərin token-lərini Redis-də saxlayın (token `jti`-si ilə). JWT guard-da Redis-i yoxlayın.
- **Qısa TTL + refresh token:** Access token TTL-ini 15 dəqiqəyə endirin, refresh token əlavə edin.

---

### 16. 🟨 `isVenueOpenByClock` — `instanceof Map` həmişə false
**Fayl:** `src/reservations/public-reservations.controller.ts:37`

```ts
const daySchedule = schedule instanceof Map ? schedule.get(todayStr) : schedule[todayStr];
```

MongoDB-dən gələn plain object heç vaxt `instanceof Map` true qaytarmaz. Bu sətir ölüdür. Daha pisi — əgər `schedule` hər hansı səbəbdən `Map`-dirsə (gələcəkdə), `schedule.get(todayStr)` işləyəcək, amma indiki halda bu kod heç vaxt işləmir. Bu birbaşa təhlükəsizlik deyil, amma bağlı məkan üçün belə rezervasiya qəbul olunmasına səbəb ola bilər (əgər schedule formatı gözlənilməzdirsə).

**Tövsiyə:** `instanceof Map` yoxlanışını silin, yalnız plain object kimi işləyin.

---

### 17. 🟨 Auth endpoint-ləri üçün rate limiting çox zəifdir
**Fayl:** `src/app.module.ts:21` — `{ ttl: 60000, limit: 20 }`

Bütün endpoint-lər üçün eyni limit: 20 sorğu/dəqiqə. Auth endpoint-ləri (login, forgot-password, verify-otp, resend-otp) üçün bu çox yüksəkdir — brute force üçün yetərlidir.

**Tövsiyə:** Auth endpoint-ləri üçün ayrıca, daha sərt throttle tətbiq edin:
```ts
ThrottlerModule.forRoot([
  { ttl: 60000, limit: 20 },  // default
  { ttl: 900000, limit: 5, name: 'auth' },  // 5 sorğu/15 dəqiqə
])
```
Və auth controller-də `@SkipThrottle()` / `@Throttle()` dekoratorları ilə tənzimləyin.

---

## Əlavə Qeydlər

### ✅ Yaxşı tərəflər (təhlükəsizlik baxımından)

- `.env` və `serviceAccountKey.json` `.gitignore`-dadır — repoya commit olunmayıb
- `ValidationPipe` — `whitelist: true`, `forbidNonWhitelisted: true` işləkdir
- `class-validator` package mövcuddur
- `bcrypt` ilə parol hash-ləmə (cost factor 10)
- CORS aktivdir (`app.enableCors()`)
- `@nestjs/throttler` rate limiting mövcuddur
- MongoDB injection — Mongoose ODM vasitəsilə qorunur
- Regex injection — `escapedSearch` ilə xüsusi simvollar qorunur
- Upload limiti 5MB + yalnız şəkil faylları qəbul olunur

### ⚠️ Nəzərə alınmalı

- `compression()` middleware — BREACH attack riski (HTTPS ilə azalır)
- Admin panel frontend-də XSS qorunması React/Vue ilə təmin olunmalıdır
- Mobil app Firebase Authentication ilə qorunur, amma backend Firebase token-i yoxlamır (#6)
