# Review Notes

Bu fayl ümumi kod analizi nəticəsində tapılan mənasız, riskli və ya optimizasiyası zəif hissələri toplamaq üçündür. Burada heç bir fix tətbiq olunmur, yalnız problem siyahısı verilir.

## Critical

1. `Venue` status kontraktı frontend və backend arasında uyğun deyil.
   Fayllar:
   - `Backend/src/venues/schemas/venue.schema.ts`
   - `OynaAdminPanel/src/pages/Venues.jsx`
   - `OynaAdminPanel/src/pages/CalendarAvailability.jsx`
   Problem:
   - Backend schema `status` üçün `DRAFT | ACTIVE | INACTIVE` gözləyir.
   - Frontend isə `PUBLISHED`, `DRAFT`, bəzən də reservation toggle məntiqində `PUBLISHED` istifadə edir.
   Risk:
   - Data inconsistent olur.
   - UI ilə DB eyni status semantikasında işləmir.
   Təklif:
   - Tək bir status contract seçilsin.
   - Mümkünsə shared enum yaradılsın və həm backend, həm frontend ona uyğunlaşdırılsın.

2. `bookingRules` data strukturu pozulub.
   Fayllar:
   - `Backend/src/venues/schemas/venue.schema.ts`
   - `OynaAdminPanel/src/pages/CalendarAvailability.jsx`
   - `OynaAdminPanel/src/store/slices/venueFormSlice.js`
   Problem:
   - Backend `minTimeMinutes` / `maxTimeMinutes` kimi numeric field-lər gözləyir.
   - Frontend isə `minTime: "1 saat"` və `maxTime: "8 saat"` string göndərir.
   Risk:
   - Schema və real payload fərqlənir.
   - Sonradan filtering, validation və analytics çətinləşir.
   Təklif:
   - Transport layer-də yalnız number saxlanılsın.
   - UI text formatı ayrıca render zamanı yaradılsın.

## High

3. Form state-lər lazımsız şəkildə iki dəfə saxlanılır.
   Fayllar:
   - `OynaAdminPanel/src/pages/AddVenue.jsx`
   - `OynaAdminPanel/src/pages/MediaPricing.jsx`
   - `OynaAdminPanel/src/pages/CalendarAvailability.jsx`
   Problem:
   - Redux state var, amma eyni field-lər ayrıca local `useState` ilə də saxlanılır.
   - Sonra `useEffect` ilə Redux-dan local state-ə sync edilir.
   Risk:
   - Lazımsız rerender.
   - State drift.
   - Lint warning-ləri və daha çətin debugging.
   Təklif:
   - Ya tam controlled local form saxlanılsın və submit-də Redux/API-yə yazılsın.
   - Ya da local duplication minimuma endirilsin.

4. `MapPicker` daxilində prop dəyişəndə state-i effect ilə zorla yeniləmək optimizasiya baxımından zəifdir.
   Fayl:
   - `OynaAdminPanel/src/components/MapPicker.jsx`
   Problem:
   - `useEffect(() => setPosition(...))` React lint warning yaradır.
   Risk:
   - Cascading render.
   - Component davranışı daha az predictible olur.
   Təklif:
   - `position` derive edilsin, ya da controlled/uncontrolled pattern aydın bölünsün.
   - Lazımdırsa `key` ilə remount yanaşması seçilsin.

5. `AddSpecs.jsx` daxilində declaration order və hook dependency problemləri var.
   Fayl:
   - `OynaAdminPanel/src/pages/AddSpecs.jsx`
   Problem:
   - `hydrateIcon`, `hydrateHardwareIcon`, `hydrateAccessoryIcon` istifadə olunduqdan sonra elan edilir.
   - Hook dependency warning-ləri var.
   Risk:
   - Lint qırılır.
   - Kodun oxunması və maintainability aşağı düşür.
   Təklif:
   - Helper-lər effect-lərdən əvvəl yerləşdirilsin.
   - Hook dependency-ləri ya düzəldilsin, ya memoized helper pattern seçilsin.

6. `foods` və `venues` modullarında `adminId` filter məntiqi mərkəzləşdirilməyib.
   Fayllar:
   - `Backend/src/foods/foods.service.ts`
   - `Backend/src/venues/venues.service.ts`
   Problem:
   - String/ObjectId çevrilməsi müxtəlif yerlərdə əl ilə edilir.
   Risk:
   - Eyni bug yenidən başqa modullarda təkrarlanır.
   Təklif:
   - Common helper və ya repository-level util yaradılıb `adminId` normalizasiya edilsin.

## Medium

7. Hardcoded Cloudinary konfigurasiya dəyərləri bir neçə yerdə təkrarlanır.
   Fayllar:
   - `OynaAdminPanel/src/pages/MediaPricing.jsx`
   - `OynaAdminPanel/src/components/FoodForm.jsx`
   Problem:
   - `cloud name` və `upload_preset` birbaşa komponentlərdə yazılıb.
   Risk:
   - Təkrarçılıq.
   - Gələcək dəyişikliklərdə bir hissənin unudulması.
   Təklif:
   - `src/config` və ya `src/lib/cloudinary.js` kimi helper çıxarılsın.

8. Upload helper-lər duplicatedir.
   Fayllar:
   - `OynaAdminPanel/src/pages/MediaPricing.jsx`
   - `OynaAdminPanel/src/components/FoodForm.jsx`
   Problem:
   - Eyni upload flow iki fərqli yerdə ayrıca yazılıb.
   Təklif:
   - Shared uploader util yaradılıb reuse edilsin.

9. `App.jsx` daxilində page routing şaxələnməsi çox böyüyür.
   Fayl:
   - `OynaAdminPanel/src/App.jsx`
   Problem:
   - Çoxlu `currentPage === ...` blokları var.
   Risk:
   - Yeni screen əlavə etdikcə maintainability pisləşəcək.
   Təklif:
   - Page map və ya real router istifadə olunsun.

10. Dead code və unused prop-lar yığılıb.
    Fayllar:
    - `OynaAdminPanel/src/components/TopNavBar.jsx`
    - `OynaAdminPanel/src/pages/AddVenue.jsx`
    - `OynaAdminPanel/src/pages/MediaPricing.jsx`
    - `OynaAdminPanel/src/pages/CalendarAvailability.jsx`
    - `OynaAdminPanel/src/pages/Venues.jsx`
    Problem:
    - `user`, `onLogout`, `setIsOpen`, `isLoading`, `err` kimi bir çox dəyişən istifadə olunmur.
    Risk:
    - Kod noise artır.
    - Həqiqi dependency-ləri görmək çətinləşir.
    Təklif:
    - Unused prop və import-lar təmizlənsin.

11. Mətnlərdə encoding problemi var.
    Fayllar:
    - Frontend və backend boyunca müxtəlif fayllar
    Problem:
    - `MÉ™kan`, `Ã‡Ä±xÄ±ÅŸ` kimi mojibake görünür.
    Risk:
    - UI keyfiyyəti aşağı düşür.
    - Copy/paste və localization daha çətin olur.
    Təklif:
    - Fayllar UTF-8 olaraq normalize edilsin.
    - Problemli string-lər toplu şəkildə təmizlənsin.

12. Sidebar/TopNav/UI hissələrində placeholder functionality çoxdur.
    Fayllar:
    - `OynaAdminPanel/src/components/Sidebar.jsx`
    - `OynaAdminPanel/src/components/TopNavBar.jsx`
    Problem:
    - Search, notifications, placeholder anchor-lar real funksiya daşımır.
    Risk:
    - UX-də “işləyir kimi görünən amma işləməyən” hissələr qalır.
    Təklif:
    - Ya disable/hidden edilsin, ya da real behavior əlavə olunsun.

## Low

13. List screen-lərdə bəzi statik style blokları page daxilində saxlanılır.
    Fayllar:
    - müxtəlif `src/pages/*.jsx`
    Problem:
    - Hər səhifədə ayrıca `<style>` blokları var.
    Təklif:
    - Ortaq utility class-lar və shared CSS layer-ə çıxarılsın.

14. `window.confirm` və oxşar native browser pattern-lər hələ bəzi yerlərdə qalır.
    Fayllar:
    - ən azı `Venues` və başqa screen-lərdə qalıq ola bilər
    Problem:
    - UI consistency pozulur.
    Təklif:
    - Shared confirm modal pattern istifadə olunsun.

## Prioritetli Fix Sırası

1. `status` və `bookingRules` data contract-lərini düzəlt
2. UTF-8 / mojibake təmizliyi et
3. duplicated form state və effect-based sync-ləri azalt
4. `AddSpecs.jsx` lint və helper order problemlərini həll et
5. Cloudinary upload helper-i shared util-ə çıxar
6. `App.jsx` page routing strukturunu sadələşdir
