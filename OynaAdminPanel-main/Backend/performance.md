# Backend Performance Analizi (Yenilənmiş)

**Tarix:** 2026-05-27 (ikinci analiz)
**Stack:** NestJS 11 + MongoDB (Mongoose 9) + Redis + Socket.IO + Firebase FCM

---

## ✅ Fix Olunmuş Problemlər (ilk analizdən sonra)

| # | Problem | Status |
|---|---------|--------|
| 1 | Rezervasiya list metodlarında pagination yox idi | ✅ `findByVenue`, `findByAdmin`, `findAll` — page/limit əlavə olunub |
| 2 | `findAllPublic` limitsiz bütün məkanları qaytarırdı | ✅ limit parametri əlavə olunub (default 1000) |
| 3 | Dashboard keşlənmirdi | ✅ Redis cache əlavə olunub (30s TTL) |
| 4 | `getPublicLayout` keşlənmirdi | ✅ Redis cache check əlavə olunub |
| 5 | `syncTableStatus` cache-i silmirdi | ✅ Redis invalidation əlavə olunub |

---

## Qalan Problemlər

### HIGH

#### 1. `venues.service.ts:findOne` — `.lean()` istifadə olunmayıb
**Fayl:** `src/venues/venues.service.ts:113-121`

Admin panel üçün `findOne` metodu `.lean()` çağırmır — lazımsız Mongoose document wrapper (getters/setters, change tracking) yaradır.

**Tövsiyə:** `.lean().exec()` əlavə edin:
```ts
const venue = await this.venueModel
  .findOne({ _id: id, adminId: toObjectId(adminId) })
  .lean()
  .exec();
```

#### 2. Food schema-da `adminId` indexi yoxdur
**Fayl:** `src/foods/schemas/food.schema.ts`

`findAll(adminId)` hər çağrılanda `adminId` ilə axtarış edir, amma bu sahəyə index qoyulmayıb. Hər admin öz yeməklərini çəkəndə full collection scan olur.

**Tövsiyə:**
```ts
FoodSchema.index({ adminId: 1 });
```

#### 3. `findByAdminForExport` — limitsiz data qaytarır
**Fayl:** `src/reservations/reservations.service.ts:142-159`

1 illik export 10,000+ rezervasiya qaytara bilər, cavab müddəti və yaddaş problemi yaradar.

**Tövsiyə:** Ya limit əlavə edin (məs: 5000), ya da stream/CSV export kimi emal edin.

---

### MEDIUM

#### 4. Regex axtarış — Text index əvəzinə `$regex` istifadə olunur
**Fayl:** `src/venues/venues.service.ts:131-133, 233-235`

Case-insensitive `$regex` MongoDB index istifadə edə bilmir — full collection scan edir. Məkan sayı artdıqca axtarış yavaşlayacaq.

**Tövsiyə:** Text index əlavə edin:
```ts
VenueSchema.index({ name: 'text', category: 'text', 'location.address': 'text' });
```
Və axtarışda `$text: { $search: search }` istifadə edin.

#### 5. `getAvailableTableCounts` + `findRandomAvailableTable` — Eyni venue 2 dəfə sorğulanır
**Fayl:** `src/venues/venues.service.ts:485-545`

Rezervasiya yaratma flowunda bu iki metod arxa-arxaya çağrılır və hər ikisi venue-nin `layout` sahəsini ayrı-ayrı MongoDB sorğuları ilə çəkir.

**Tövsiyə:** İlk sorğunun nəticəsini qısa müddətlik (5 saniyə) Redis-də keşləyin. Və ya `getAvailableTableCounts`-in nəticəsini `findRandomAvailableTable`-ə parametr kimi ötürün.

#### 6. `findByUser` — totalCount qaytarmır
**Fayl:** `src/reservations/reservations.service.ts:174-183`

İstifadəçi öz rezervasiyalarını pagination ilə çəkir, amma cavabda `totalCount` və ya `hasMore` yoxdur. Flutter app "daha çox" olub-olmadığını bilmir.

**Tövsiyə:** `findByAdminPaginated` kimi `{ data, total, page, limit, hasMore }` formatı qaytarın.

#### 7. Auto-reject hər 30 saniyədən bir boşuna işləyir
**Fayl:** `src/reservations/auto-reject.task.ts:27`

Gecə saatlarında və ya heç bir aktiv rezervasiya olmayanda belə sorğu gedir.

**Tövsiyə:** Heç bir expired reservation tapılmayanda intervalı müvəqqəti artıran adaptive polling əlavə edin (məs: 5 dəqiqə). Yaxud Redis-də aktiv rezervasiya sayğacı saxlayın.

---

### LOW

#### 8. `emitTablePending` — Cüt notification
**Fayl:** `src/reservations/reservations.gateway.ts:114-127`

Həm `venue_{id}` otağına, həm də `admins` otağına eyni event göndərilir. Admin hər iki otaqda varsa, cüt notification alacaq.

**Tövsiyə:** Yalnız `venue_{id}` otağına göndərin — admin onsuz da `handleConnection`-da həmin otağa qoşulur.

#### 9. `getAvailableTableCounts` — İkili açar
**Fayl:** `src/venues/venues.service.ts:494-507`

Eyni tier üçün həm `tierId` (xam), həm də `normalizedTitle` açarı ilə sayğac saxlanır.

**Tövsiyə:** Client-side-də yalnız bir formatı gözləyin, server-də ikili açar saxlamayın.

#### 10. `calculateGraceDeadline` — Potensial timezone problemi
**Fayl:** `src/reservations/reservations.service.ts:238-244`

`new Date(\`${date}T${time}:00\`)` serverin lokal timezone-undan asılıdır. Server UTC-də, istifadəçi UTC+4-də olanda deadline 4 saat yanlış ola bilər.

**Tövsiyə:** Tarix/saat əməliyyatlarını explicit timezone ilə edin (məsələn `luxon` və ya `date-fns-tz` kitabxanaları ilə).

#### 11. `reservationNumber` — Unikallıq zəmanəti yoxdur
**Fayl:** `src/reservations/reservations.service.ts:25-32`

6 simvollu təsadüfi string 32^6 ≈ 1 milyard kombinasiya yaradır — ehtimal çox aşağıdır, amma texniki olaraq collision mümkündür.

**Tövsiyə:** Schema-da `unique: true` + `sparse: true` artıq var. Əgər `MongoError: duplicate key` yaranarsa, retry mexanizmi əlavə edin.

---

## ✅ Yaxşı Tərəflər (Qorunub Saxlanılıb)

1. Redis cache-aside pattern — Foods, Venues, Dashboard
2. Bulk operations — Auto-reject `updateMany` istifadə edir
3. Distributed locks — Stol rezervasiyasında Redis lock (`acquireLock/releaseLock`)
4. Connection pooling — MongoDB `maxPoolSize: 20`, `minPoolSize: 5`
5. Proper indexes — Reservation-da 7 index, Venue-da 2dsphere + adminId + status
6. Compression middleware — aktivdir
7. Rate limiting — `ThrottlerModule` 20 req/dəq
8. Lean queries — əksər sorğularda `.lean()` istifadə olunur
9. `Promise.all` — Paralel sorğular (dashboard, auto-reject)
10. `$facet` — Dashboard və paginated venues bir pipeline-da data + count
11. WebSocket room-based targeting — Admin/user otaqları
12. FCM invalid token cleanup — `messaging/invalid-registration-token` xətasında avtomatik silinir
