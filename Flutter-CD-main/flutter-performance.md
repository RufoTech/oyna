# Flutter App Performans Analizi Hesabatı (Discovery App)

Bu sənəd tətbiqin sürətini, FPS-ini və resurs (batareya/yaddaş) istifadəsini artırmaq üçün kod bazasında aşkarlanmış performans problemlərini və onların aradan qaldırılması yollarını əhatə edir.

---

## 📊 Ümumi Performans İcmalı və Xülasə Cədvəli

Kod bazasında aparılan dərin analiz nəticəsində **20 vacib performans və kod keyfiyyəti problemi** müəyyən edilmişdir. Tapılan bütün problemlər, onun ciddilik dərəcəsi və optimallaşdırma sahələri aşağıdakı cədvəldə ümumiləşdirilmişdir:

| ID | Status | Problem Sahəsi | Fayl / Widget | Optimallaşdırma Növü |
| :--- | :---: | :--- | :--- | :--- |
| **1** | 🔴 Kritik | `FutureBuilder` re-triggering (Auth disk I/O) | `lib/app.dart` | Asinxron Gecikmə |
| **2** | 🔴 Kritik | Xəritə markerlərində `BackdropFilter` | `lib/features/home/.../map_background.dart` | GPU Yüklənməsi / FPS |
| **3** | 🔴 Kritik | Drag zamanı xəritə və detalların lazımsız rebuildi | `lib/features/home/.../home_screen.dart` | Render / FPS |
| **4** | 🔴 Kritik | Eyni anda iki xəritə instansiyasının aktiv olması | `lib/features/search/.../venue_map_section.dart` | Yaddaş (RAM) |
| **5** | 🟡 Orta | `IndexedStack` arxasında taymerlərin boşa işləməsi | `lib/features/search/.../search_screen.dart` | Batareya / Background CPU |
| **6** | 🟡 Orta | Dio Interceptor daxilində asinxron disk I/O | `lib/core/network/dio_client.dart` | Sorğu Gecikməsi |
| **7** | 🟡 Orta | Sürüşdürmə zamanı ağır coğrafi hesablamalar | `lib/features/search/.../search_screen.dart` | Prosessor (CPU) Yükü |
| **8** | 🟡 Orta | `FloorPlanViewer` redundant rebuilds (List `!=`) | `lib/features/search/.../floor_plan_viewer.dart` | Lazımsız Render |
| **9** | 🟡 Orta | Siyahılarda virtualizasiyanın (Lazy Loading) olmaması | `lib/features/favorites/.../favorites_screen.dart`| Yaddaş (RAM) |
| **10** | 🟡 Orta | `getCurrentPosition()` tez-tez çağırılması | `lib/core/providers/location_provider.dart` | Batareya / Gecikmə |
| **11** | 🔴 Kritik | BottomNavigationBar-də GlassPanel (BackdropFilter) | `lib/features/home/.../bottom_nav_bar.dart:72` | GPU / Batareya |
| **12** | 🔴 Kritik | OnboardingScreen-də iki nəhəng BackdropFilter (120/100)| `lib/features/onboarding/.../onboarding_screen.dart` | GPU / Cihaz Qızması |
| **13** | 🔴 Kritik | ReservationScreen-də 1 saniyəlik Timer | `lib/features/search/.../reservation_screen.dart:95` | Batareya / CPU Yükü |
| **14** | 🔴 Kritik | `CachedNetworkImage`-də keş ölçülərinin olmaması | `lib/features/home/.../venue_card.dart` | Yaddaş (RAM) Sızması |
| **15** | 🟡 Orta | `BuildContext`-in asinxron boşluqlarda istifadəsi | Səhifələrdəki asinxron metodlar (`login`, `res`) | Sabitlik / Crash Prevention |
| **16** | 🟡 Orta | Köhnəlmiş (Deprecated) API-lərin istifadəsi | `location_provider.dart`, `otp_screen.dart` | Gələcək Uyğunluq |
| **17** | 🟡 Orta | Siyahılarda və tablarda `KeepAlive` mixin-in olmaması | `favorites_screen.dart`, `search_screen.dart` | RAM / Scroll Keşləmə |
| **18** | 🟡 Orta | OnboardingScreen-in 38KB monolit strukturda olması | `onboarding_screen.dart` | Tree-shaking / Oxunurluq |
| **19** | 🟡 Orta | `MediaQuery.of` hər frame-də tam rebuild etməsi | Müxtəlif widget və ekran build metodları | Mikro-optimallaşdırma |
| **20** | 🟢 Yüngül | Shimmer keşləmə, lokal şriftlər və const constructor | Bütün layihə boyunca | Ümumi Sürət (Quick Wins) |

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

### 🔴 11. BottomNavigationBar-də GlassPanel (BackdropFilter) — Daimi GPU Yükü
* **Yerləşdiyi fayl:** [lib/features/home/presentation/widgets/bottom_nav_bar.dart:72](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/home/presentation/widgets/bottom_nav_bar.dart#L72)
* **Problem:** 
  Alt naviqasiya paneli hər zaman `GlassPanel(blurSigma: 30)` ilə örtülmüşdür. NavBar tətbiq daxilində 4 tabda da daim ekrandadır və istifadəçi heç bir şey etməsə belə, GPU hər frame-də (saniyədə 60-120 dəfə) naviqasiya panelinin arxasındakı fonu kəsib bulandırmağa (blur) davam edir. Bu, daimi GPU rendering yükü yaradır, cihazı qızdırır və batareyanı sürətlə tükədir.
* **Həlli:** 
  `GlassPanel`-i ləğv edib, sadə `Container` və `BoxDecoration` vasitəsilə yarımşəffaf fon istifadə edin:
  ```dart
  Container(
    decoration: BoxDecoration(
      color: AppColors.surface.withOpacity(0.92), // Sürətli rendering
      borderRadius: BorderRadius.circular(100),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.05),
          blurRadius: 32,
          spreadRadius: 2,
        ),
      ],
    ),
    child: ...,
  )
  ```

---

### 🔴 12. OnboardingScreen-də İki Nəhəng BackdropFilter (sigma 120 və 100)
* **Yerləşdiyi fayl:** [lib/features/onboarding/presentation/screens/onboarding_screen.dart:81, 94](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/onboarding/presentation/screens/onboarding_screen.dart#L81)
* **Problem:** 
  Onboarding ekranında arxa fondakı dekorativ yumşaq işıq (glow) effekti yaratmaq üçün 500x500 və 400x400 ölçülü nəhəng konteynerlərdə `.blurred(sigma: 120)` və `.blurred(sigma: 100)` (BackdropFilter) çağırılır. Çox böyük sahədə bu dərəcədə yüksək blur tətbiq edilməsi aşağı və orta səviyyəli cihazlarda onboarding ekranı açılan kimi ciddi şəkildə kadr düşməsinə (FPS drop) və ya donmalara (ANR) səbəb olur.
* **Həlli:** 
  Ağır GPU bluru əvəzinə eyni vizual effekti sıfır GPU yükü ilə verən statik radial gradient (`RadialGradient`) istifadə edin:
  ```dart
  Container(
    width: 500,
    height: 500,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      gradient: RadialGradient(
        colors: [
          AppColors.onSurface.withOpacity(0.03),
          Colors.transparent,
        ],
      ),
    ),
  )
  ```

---

### 🔴 13. ReservationScreen-də 1 Saniyəlik Timer — Güclü Batareya Sərfiyyatı
* **Yerləşdiyi fayl:** [lib/features/search/presentation/screens/reservation_screen.dart:95](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/screens/reservation_screen.dart#L95)
* **Problem:** 
  Rezervasiya ekranında `Timer.periodic(const Duration(seconds: 1), ...)` hər saniyə işləyərək `isOpenByClock` yoxlanışını aparır və widget-in vəziyyətini yeniləyir (`setState`). `isOpenByClock` metodu isə hər dəfə asinxron vaxtı oxuyur və string parsing əməliyyatları icra edir. Hər saniyə bu ağır yoxlanışın aparılması prosessoru (CPU) məşğul saxlayır və güclü batareya sərfiyyatına yol açır.
* **Həlli:** 
  * Periodik timer intervalını ən azı 30 və ya 60 saniyəyə qaldırın.
  * Ən yaxşı variant: Məkanın bağlanma vaxtını bir dəfə hesablayıb, həmin vaxta uyğun tək bir birdəfəlik Timer (one-shot timer) qurmaqdır.

---

### 🔴 14. CachedNetworkImage-də memCacheWidth və memCacheHeight Parametrlərinin Olmaması (Yaddaş/RAM Sızması)
* **Yerləşdiyi fayllar:** 
  * [lib/features/home/presentation/widgets/venue_card.dart#L80](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/home/presentation/widgets/venue_card.dart#L80)
  * [lib/features/search/presentation/widgets/search_result_card.dart#L72](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/widgets/search_result_card.dart#L72)
* **Problem:** 
  Məkan şəkilləri şəbəkədən `CachedNetworkImage` vasitəsilə yüklənir. Şəkillərin ölçüsü çox böyük (məsələn, 2K-4K, 4MB) ola bilər. `memCacheWidth` və `memCacheHeight` limitləri təyin edilmədiyinə görə, Flutter bu böyük şəkilləri tam ölçüdə RAM-da decode edir və saxlayır. Kiçik bir widget daxilində (məsələn, 96x96 ölçülü kiçik avatar) 4K şəklin render olunması yaddaşı (RAM) sürətlə doldurur və tətbiqin çökməsinə (Out of Memory) gətirib çıxarır.
* **Həlli:** 
  Şəkillərin RAM-da yalnız göstəriləcəyi vizual ölçüdə decode olunması üçün cache limitlərini qeyd edin:
  ```dart
  CachedNetworkImage(
    imageUrl: imageUrl,
    memCacheWidth: 200,  // Ekran piksel sıxlığı nəzərə alınaraq
    memCacheHeight: 200,
    fit: BoxFit.cover,
  )
  ```

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

### 🟡 15. Siyahılarda və Tablarda KeepAlive (AutomaticKeepAliveClientMixin) Olmaması
* **Yerləşdiyi fayllar:** 
  * [lib/features/favorites/presentation/screens/favorites_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/favorites/presentation/screens/favorites_screen.dart)
  * [lib/features/search/presentation/screens/search_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/search/presentation/screens/search_screen.dart)
* **Problem:** 
  Siyahı elementləri ekrandan çıxanda (scroll) və ya istifadəçi tablar arasında keçid edəndə mövcud ekranın render vəziyyəti (scroll mövqeyi, yüklənmiş kart state-ləri) yaddaşdan tamamilə silinir. Yenidən qayıtdıqda ekran sıfırdan yüklənir. Bu, RAM yaddaşını təmizləsə də, UI səviyyəsində hər dəfə mikro-donmalara (jank) və pis istifadəçi təcrübəsinə (bütün scroll mövqelərinin itməsi) səbəb olur.
* **Həlli:** 
  Ekranların state siniflərinə `AutomaticKeepAliveClientMixin` əlavə edin və `wantKeepAlive => true` qaytarın. Bu sayədə tab dəyişəndə və ya sürüşdürəndə mövcud scroll mövqeyi qorunub saxlanacaq.

---

### 🟡 16. OnboardingScreen-in 38KB-lıq Nəhəng Monolit Strukturda Olması
* **Yerləşdiyi fayl:** [lib/features/onboarding/presentation/screens/onboarding_screen.dart](file:///c:/Users/ASUS/Desktop/OynaBeta/oyna/Flutter-CD-main/lib/features/onboarding/presentation/screens/onboarding_screen.dart)
* **Problem:** 
  `onboarding_screen.dart` faylı 900+ sətirdən ibarətdir və bütün onboarding məntiqini, step widget-lərini, animasiyaları və xüsusi dizayn elementlərini özündə birləşdirən nəhəng bir monolitdir. Bu struktur tree-shaking optimallaşdırmasını çətinləşdirir və kodun maintainable olmasını pisləşdirir.
* **Həlli:** 
  Addım widget-lərini (`_buildStepOne`, `_buildStepTwo`, `_buildStepThree`) və köməkçi özəl komponentləri (`_CustomPin`, `_PulseDot`) müstəqil alt fayllara çıxarın.

---

### 🟡 17. MediaQuery.of(context) ilə Bütün Səhifənin Lazımsız Rebuild Olması
* **Problem:** 
  Dizaynda yalnız ekranın ölçüsünü və ya padding boşluqlarını öyrənmək üçün birbaşa `MediaQuery.of(context)` çağırılır. Bu çağırış widget-i MediaQuery obyektinin bütün xüsusiyyətlərinə (məsələn, klaviatura açılanda ekran ölçüsünün dəyişməsi, safe area yenilənmələri) abunə edir. Nəticədə tamamilə əlaqəsiz hər hansı bir sistem dəyişikliyində bütün səhifə yenidən build olunur.
* **Həlli:** 
  Flutter 3.10+ versiyalarından başlayaraq yalnız lazım olan dəyərlərə spesifik abunə olun:
  - Ekran ölçüsü üçün: `MediaQuery.sizeOf(context)`
  - Padding / Safe area üçün: `MediaQuery.paddingOf(context)`
  - Platform parlaqlığı üçün: `MediaQuery.platformBrightnessOf(context)`

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
4. **Shimmer Animasiyalarının Keşlənməsi:**
   Tətbiqdə skelet yüklənmə (Shimmer) effekti verən elementləri təkrar render etməmək üçün static caching tətbiq edin.
