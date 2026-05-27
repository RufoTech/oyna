# Flutter App Performans Analizi Hesabatı (Discovery App)

Bu sənəd tətbiqin sürətini, FPS-ini və resurs (batareya/yaddaş) istifadəsini artırmaq üçün kod bazasında aşkarlanmış performans problemlərini və onların aradan qaldırılması yollarını əhatə edir.

---

## 1. Kritik Performans Problemləri (Critical Bottlenecks)

### 🔴 1. FutureBuilder re-triggering (I/O və Auth Gecikmələri)
* **Yerləşdiyi fayl:** [lib/app.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/app.dart#L49-L66)
* **Problem:** 
  `App` sinfi Riverpod-un `ConsumerWidget`-dir və `localeProvider`-i dinləyir. Eyni zamanda, `FutureBuilder` daxilində birbaşa funksiya çağırışı aparılır:
  ```dart
  home: FutureBuilder<bool>(
    future: _isUserLoggedIn(), // HƏR BUILD ZAMANI YENİDƏN ÇAĞIRILIR!
    ...
  )
  ```
  Dil dəyişdikdə, mövzu yeniləndə və ya tətbiq hər hansı səbəbdən yenidən build olanda, `_isUserLoggedIn()` yenidən işə düşür. Bu da hər dəfə native səviyyədə `SharedPreferences.getInstance()` çağırışına və Firebase Auth statusunun asinxron yoxlanılmasına səbəb olur. Nəticədə lazımsız disk əməliyyatları yaranır və tətbiqin ilkin yüklənməsi yubana bilir.
* **Həlli:** 
  İstifadəçinin giriş statusunu Riverpod-un bir `FutureProvider` və ya `StreamProvider` (məsələn, `authStateProvider`) daxilinə köçürün və widget build metodunda onu sadəcə dinləyin (`ref.watch`).

---

### 🔴 2. Xəritə Markerlərində `BackdropFilter` (Ağır GPU Yüklənməsi və FPS Düşüşü)
* **Yerləşdiyi fayl:** [lib/features/home/presentation/widgets/map_background.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/home/presentation/widgets/map_background.dart#L247-L274)
* **Problem:** 
  Xəritə üzərindəki hər bir məkan markeri (`_VenuePin`) daxilində frosted glass effekti vermək üçün `GlassPanel` widget-indən istifadə olunur:
  ```dart
  // Label hissəsi
  GlassPanel(
    borderRadius: BorderRadius.circular(100),
    blurSigma: 25,
    ...
  )
  ```
  `GlassPanel` daxilində `BackdropFilter` ilə 25 sigma blur (bulandırma) tətbiq olunur. `BackdropFilter` Flutter-də ən ağır rendering əməliyyatlarından biridir. Xəritədə onlarla marker olduqda və istifadəçi xəritəni sürüşdürdükdə (pan/zoom) GPU hər marker üçün arxa fonu saniyədə 60 dəfə kəsib bulandırmağa məcbur olur. Bu, xəritədə ciddi donmalara (jank/lag) səbəb olur.
* **Həlli:** 
  Xəritədəki markerlərin etiketlərində (label) `GlassPanel` (blur) istifadə etməyin. Bunun əvəzinə yarımşəffaf normal fon rəngindən istifadə edin:
  ```dart
  Container(
    decoration: BoxDecoration(
      color: AppColors.surface.withOpacity(0.9), // Blur-suz, sürətli rendering
      borderRadius: BorderRadius.circular(100),
    ),
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
    ...
  )
  ```

---

### 🔴 3. Sürüşdürmə (Drag) Zamanı Xəritənin və Detallar Səhifəsinin Rebuild Olması
* **Yerləşdiyi fayl:** [lib/features/home/presentation/screens/home_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/home/presentation/screens/home_screen.dart#L145-L213)
* **Problem:** 
  Məkan kartı yuxarı sürüşdürülərkən hər piksel hərəkətində `setState(() { _dragOffset = ... })` çağırılır. Bu, `HomeScreen`-in və onun bütün uşaq elementlərinin (böyük `MapBackground` və daxili ağır `VenueDetailScreen` də daxil olmaqla) saniyədə 60-120 dəfə (ekran tezliyindən asılı olaraq) sıfırdan build olunmasına səbəb olur. Bu səbəbdən sürüşdürmə animasiyası olduqca gecikməli işləyir.
* **Həlli:** 
  * `setState` yerinə yuxarı sürüşməni idarə etmək üçün `AnimationController`-dən gələn dəyərləri bir `AnimatedBuilder` və ya `PositionedTransition` vasitəsilə tətbiq edin.
  * Detal səhifəsini (`VenueDetailScreen`) və xəritəni sabit saxlayın və yalnız mövqe dəyişən konteyneri animasiya edin.
  * Ən ideal variant Flutter-in öz `DraggableScrollableSheet` widget-ini tətbiq etməkdir, çünki o, scroll və drag əməliyyatlarını native səviyyədə optimallaşdırır.

---

### 🔴 4. Eyni Anda İki Xəritənin (Multi-Map Instance) Aktiv Olması
* **Yerləşdiyi fayl:** [lib/features/search/presentation/widgets/venue_detail/venue_map_section.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/widgets/venue_detail/venue_map_section.dart#L175-L203) və [lib/features/home/presentation/widgets/map_background.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/home/presentation/widgets/map_background.dart)
* **Problem:** 
  İstifadəçi bir məkanın detallarına baxanda, arxa fondakı əsas kəşf xəritəsi (`MapBackground`) yaddaşda qalmağa davam edir. Eyni zamanda detallar bölməsində ünvanı göstərən daha bir `FlutterMap` işə salınır. Birdən çox interaktiv xəritə instansiyasının eyni vaxtda işləməsi yaddaşı (RAM) ikiqat doldurur və zəif cihazlarda çökmələrə (Out of Memory) yol aça bilər.
* **Həlli:** 
  Detal səhifəsindəki kiçik xəritəni interaktiv etmək əvəzinə, statik bir şəkil (məsələn, Mapbox Static Images API vasitəsilə) kimi göstərin. İstifadəçi üstünə tıkladıqda xarici Google Maps/Apple Maps proqramını və ya ayrıca interaktiv tam ekran xəritəni açın.

---

## 2. Orta Səviyyəli və Struktur Problemləri (Medium Issues)

### 🟡 5. IndexedStack-də Taymerlərin Arxa Planda Boşa İşləməsi (Background Drain)
* **Yerləşdiyi fayl:** [lib/features/search/presentation/screens/search_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/screens/search_screen.dart#L36-L38)
* **Problem:** 
  Tətbiq `MainScreen` daxilində `IndexedStack` istifadə edir. `IndexedStack` bütün alt səhifələri (Map, Search, Favorites, Profile) ilk build-də yaradır və yaddaşda saxlayır.
  `SearchScreen`-in `initState` metodunda real-vaxt saatına görə hər 15 saniyədən bir `setState` çağıran periodic timer qurulmuşdur:
  ```dart
  _clockTimer = Timer.periodic(const Duration(seconds: 15), (_) {
    if (mounted) setState(() {});
  });
  ```
  İstifadəçi axtarış bölməsində olmasa belə (məsələn, xəritədə gəzir və ya profildədir), bu taymer arxa planda saniyəbəsaniyə işləməyə davam edir və hər 15 saniyədən bir gizli axtarış səhifəsini yenidən build edir. Bu da prosessoru məşğul edir və batareyanı sürətlə tükədir.
* **Həlli:** 
  Taymeri yalnız `SearchScreen` ekranda aktiv və görünən olanda işə salın. Bunu cari aktiv tab indeksini Riverpod ilə dinləyərək etmək olar.

---

### 🟡 6. Dio Interceptor daxilində Disk I/O Əməliyyatları
* **Yerləşdiyi fayl:** [lib/core/network/dio_client.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/core/network/dio_client.dart#L43) və [lib/core/services/auth_service.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/core/services/auth_service.dart#L25-L28)
* **Problem:** 
  Hər bir API sorğusunda Dio interceptor `AuthService().getToken()` metodunu gözləyir (await). Bu metod isə hər dəfə native kanala gedərək diskdən SharedPreferences oxuyur. Disk oxunuşu Native kanalda baş verdiyi üçün hər sorğuda əlavə mikrosaniyələr səviyyəsində asinxron gecikmə yaradır.
* **Həlli:** 
  Tokeni ilk dəfə tətbiq açılanda SharedPreferences-dən bir dəfə oxuyub `AuthService` singleton sinfində in-memory dəyişəndə (`String? _cachedToken`) saxlayın. Interceptor isə heç bir asinxron gözləmə olmadan birbaşa bu yaddaşdakı tokeni sinxron oxusun.

---

### 🟡 7. Siyahı Sürüşdürülərkən Ağır Riyazi Coğrafi Hesablamaların Aparılması
* **Yerləşdiyi fayl:** [lib/features/search/presentation/screens/search_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/screens/search_screen.dart#L353-L360)
* **Problem:** 
  Axtarış siyahısında hər bir element ekrana gələndə `SliverChildBuilderDelegate` daxilində istifadəçi ilə məkan arasındakı məsafə hesablanır:
  ```dart
  distanceMeters = _calculateDistanceMeters(userLocation, venue.location!.latitude, venue.location!.longitude);
  ```
  `Geolocator.distanceBetween(...)` trigonometrik hesablamalar aparır. İstifadəçi siyahını sürətlə aşağı-yuxarı hərəkət etdirəndə bu ağır hesablama hər frame-də təkrarlanır və UI-da donmalara (jank) səbəb ola bilər.
* **Həlli:** 
  Məsafəni birbaşa build metodunda hesablamayın. Siyahı backend-dən yüklənəndə və ya istifadəçinin GPS koordinatları əhəmiyyətli dərəcədə dəyişəndə bir dəfə hesablayıb modeli yeniləyin və build metodunda sadəcə string dəyəri göstərin.

---

### 🟡 8. FloorPlanViewer Redundant Rebuilds (Siyahı Müqayisəsi Xətası)
* **Yerləşdiyi fayl:** [lib/features/search/presentation/widgets/reservation/floor_plan_viewer.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/widgets/reservation/floor_plan_viewer.dart#L88)
* **Problem:** 
  `FloorPlanViewer` widget build metodunda bu şərt yoxlanılır:
  ```dart
  if (!_isInitialized || _lastViewportSize != viewportSize || _lastItems != widget.items)
  ```
  Dart dilində list müqayisəsi (`!=`) referensə görədir. Valideyn widget hər rebuild olanda Riverpod-dan yeni siyahı referensi gəlir, nəticədə `_lastItems != widget.items` həmişə `true` olur. Bu da hər dəfə post-frame callback ilə `setState` çağırılmasına və lazımsız təkrar renderingə səbəb olur.
* **Həlli:** 
  Siyahıların elementlərini müqayisə etmək üçün `collection` paketindən `const ListEquality().equals(a, b)` metodunu istifadə edin və ya element sayını və ID-lərini yoxlayın.

---

### 🟡 9. Siyahılarda Virtualizasiyanın Olmaması (Lazy Loading-in İtirlməsi)
* **Yerləşdiyi fayl:** [lib/features/favorites/presentation/screens/favorites_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/favorites/presentation/screens/favorites_screen.dart#L140-L182)
* **Problem:** 
  Favoritlər siyahısında bütün elementlər `Column` daxilində `.map().toList()` şəklində birbaşa ekrana yüklənir. Əgər istifadəçinin favoritləri çoxdursa, tətbiq hamısını eyni anda render etməyə çalışır və yaddaşı doldurur.
* **Həlli:** 
  `SliverList.builder` və ya `ListView.builder` vasitəsilə yalnız ekranda görünən elementlərin dinamik render olunmasını təmin edin.

---

### 🟡 10. getCurrentPosition() Gecikmələri və Batareya Sərfiyyatı
* **Yerləşdiyi fayl:** [lib/core/providers/location_provider.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/core/providers/location_provider.dart#L46)
* **Problem:** 
  Məkan təyini üçün birbaşa `Geolocator.getCurrentPosition()` çağırılır. Bu metod GPS peyklərindən aktiv siqnal axtarır və 10 saniyəyədək vaxt apara bilir. Həmçinin cihazın batareyasını çox işlədir.
* **Həlli:** 
  İlk növbədə sürətli və batareya dostu olan `Geolocator.getLastKnownPosition()` metodundan istifadə edin. Əgər tapılmazsa və ya məlumat köhnədirsə, o zaman lazımi accuracy dərəcəsi ilə `getCurrentPosition()` çağırın.

---

## 3. Statik Analiz (Lints) və Kod Keyfiyyəti (Static Analysis Report)

`flutter analyze` əmrinin icrası nəticəsində tapılan **63 problemin** vacib hissələri:

### ⚠️ A. Async Gaps daxilində BuildContext İstifadəsi (`use_build_context_synchronously`)
* **Problem:** Bir çox səhifədə asinxron gözləmədən (await) sonra birbaşa `BuildContext` vasitəsilə ekran keçidləri (`Navigator`), Dialoqlar və ya `ScaffoldMessenger` çağırılır. Əgər istifadəçi asinxron əməliyyat bitmədən səhifədən çıxarsa (widget dispose olarsa), bu çağırışlar tətbiqin çökməsinə (crash) səbəb ola bilər.
* **Yerlər:**
  * [lib/features/auth/presentation/screens/login_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/auth/presentation/screens/login_screen.dart#L109)
  * [lib/features/auth/presentation/screens/register_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/auth/presentation/screens/register_screen.dart#L121)
  * [lib/features/profile/presentation/screens/edit_name_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/profile/presentation/screens/edit_name_screen.dart#L85)
  * [lib/features/search/presentation/screens/reservation_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/screens/reservation_screen.dart#L395)
* **Həlli:** Çağırışdan əvvəl `if (mounted)` və ya `if (context.mounted)` yoxlaması əlavə edilməlidir.

### ⚠️ B. Köhnəlmiş Metod və Widget-lər (Deprecated APIs)
* **Problem:** Gələcək Flutter/Riverpod yenilənmələrində tamamilə silinəcək və tətbiqi qıracaq API-lərdən istifadə olunur:
  * `ProviderRef` istifadəsi [location_provider.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/core/providers/location_provider.dart#L14) daxilində (Riverpod v3.0-da silinəcək). **Həlli:** `Ref` sinfinə keçin.
  * `RawKeyEvent`, `RawKeyDownEvent` və `RawKeyboardListener` [otp_verification_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/auth/presentation/screens/otp_verification_screen.dart#L79) daxilində. **Həlli:** `KeyEvent`, `KeyDownEvent` və `KeyboardListener` istifadə edin.
  * `groupValue` və `onChanged` (Radio üçün) [reservation_form_widgets.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/widgets/reservation/reservation_form_widgets.dart#L538) daxilində.

### ⚠️ C. İstifadə Edilməyən (Dead Code) Elementlər (Binary Size artımı)
* **Problem:** Kod bazasında yaddaşda lazımsız yer tutan və tətbiq daxilində çağırılmayan ölü kodlar var:
  * `_ActivePin` və `_ActionableMarker` widget-ləri [map_background.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/home/presentation/widgets/map_background.dart#L279) faylında heç yerdə istifadə olunmur.
  * `_hardwareValue` metodu [pc_details_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/screens/pc_details_screen.dart#L16) faylında istifadə olunmur.

---

## 4. Performansı Artıracaq Digər Şeylər (Quick Wins)

1. **Google Fonts Lokal Keşləmə:**
   `google_fonts` paketi standart olaraq fontları tətbiq açılanda HTTP vasitəsilə internetdən yükləyir. İnternet zəif olduqda bu, yazılarda vizual gecikmələrə səbəb olur. Font fayllarını local olaraq `assets/fonts/` qovluğuna yerləşdirib `pubspec.yaml`-da qeyd etmək lazımdır.
2. **HTTP Caching Interceptor:**
   Məkan məlumatları (venues) asanlıqla dəyişən məlumatlar deyil. `dio_cache_interceptor` paketini əlavə etməklə backend sorğularını keşləmək olar. Bu, həm tətbiqi sürətləndirər, həm də backend yüklənməsini azaldar.
3. **Const Konstruktorların Çatışmazlığı:**
   Dəyişməz widget-lər `const` konstruktoru ilə çağırılmalıdır. Hər build zamanı bu obyektlərin yenidən yaranmaması üçün başlarına `const` artırmaq olduqca vacibdir.
