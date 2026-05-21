# Admin Panel UI Üçün AI Promptu (PC və Qiymətləndirmə İdarəetməsi)

Aşağıdakı mətni kopyalayaraq React/Next.js və ya başqa bir UI yaradan AI modelinə (məsələn, v0.dev, ChatGPT, Claude) göndərin. Bu prompt AI-ın sizin üçün tam dəqiq admin paneli interfeysi yaratmasını təmin edəcək.

---

**Role:** You are an expert Frontend Developer and UI/UX Designer.
**Task:** Təqdim olunan verilənlər strukturuna əsasən, bir oyun klubu (Gaming Lounge) üçün dinamik "Qiymətlər və Kompüter Özəllikləri"ni idarə edən Admin Panel Formu (UI) hazırlamaq.
**Tech Stack:** React (və ya Next.js), Tailwind CSS, Lucide Icons (və ya hər hansı müasir ikon kitabxanası).

### 📝 Kontekst və Tələblər:
Bu admin panel, istifadəçi tərəfindəki mobil tətbiqin (Flutter) **"Venue Rates Screen"** (Qiymətlər səhifəsi) və **"PC Details Screen"** (Kompüter detalları) hissələrindəki məlumatları dinamik şəkildə idarə etmək üçün istifadə olunacaq. Sistem admini fərqli kompüter otaqları/səviyyələri (məs: Elit, Standart) yarada bilməli və hər səviyyə üçün xüsusi göstəricilər əlavə edə bilməlidir.

### 🗂️ Tələb Olunan Form Sahələri (Verilənlər Strukturu):

Form iki əsas hissəyə bölünməlidir. Səhifə asan istifadə edilə bilən, təkrarlanan (dynamic array / nested array) sahələrdən ibarət olmalıdır.

#### Bölmə 1: PC Kateqoriyası və Qiymətləndirmə (Venue Rates Screen)
İdarəçilər həm səhifənin ümumi marketinq mətnlərini, həm də PC kateqoriyalarını əlavə edə bilməlidir.

**1.1 Səhifə Başlığı və Təsviri (Header Section):**
1. **Section Title:** Text Input (Məsələn: "Elit Səviyyə Oyun Təcrübəsi Rəqəmsal Barmaqlarınızın Ucunda.")
2. **Section Subtitle:** Textarea (Məsələn: "Yüksək yeniləmə tezliyi və premium qəlyanaltılarla rəqabətli oyun mühitini kəşf edin.")

**1.2 PC Kateqoriyaları (Tiers):**
Hər kateqoriya üçün aşağıdakı inputlar olmalıdır:
1. **Tier Title (Səviyyənin Adı):** Text Input (Məsələn: "Elit Səviyyəli", "Standart PC")
2. **Tier Description (Səviyyənin Təsviri/Paraqrafı):** Textarea (Məsələn: "RTX 3060 165Hz və s.")
3. **Hourly Rate (Saatlıq Qiymət):** Number Input. (Məsələn: 5, 10)
4. **Currency/Unit (Valyuta və Vahid):** Text Input (Məsələn: "AZN / saat")
5. **Special Packages (Xüsusi Paketlər Katoloqu):** Bu hissə dinamik siyahı (Add new package) olmalıdır.
    - **Package Title (Paket Başlığı):** Text Input (Məsələn: "Gecə Paketi", "3 Saatlıq Paket")
    - **Package Description (Paket Təsviri/Paraqraf):** Textarea (Məsələn: "23:00 - 08:00 arası limitiz oyun")
    - **Package Price (Paketin Qiyməti):** Number/Text Input (Məsələn: 15 AZN)

#### Bölmə 2: Təchizat və Avadanlıqların Detalları (PC Details Screen)
Hər bir təyin olunmuş PC Səviyyəsi daxilində detallı avadanlıq və göstəriciləri idarə edən alt-bölmə:
1. **Hardware Features (Təchizat Xüsusiyyətləri):** Dinamik siyahı (Add new feature düyməsi ilə).
    - **Feature Icon (İkon):** Select dropdown (və ya Icon picker) to choose an icon representing the feature.
    - **Feature Title (Xüsusiyyət Başlığı):** Text Input (Məsələn: "Yüksək yeniləmə tezliyi", "Mexaniki Klaviatura")
    - **Feature Description (Xüsusiyyət Açıqlaması):** Text Input (Məsələn: "165 Hz Monitor", "Razer BlackWidow")
2. **Accessories List (Aksesuarlar və Qadcetlər):** Dinamik siyahı (Add new accessory düyməsi ilə).
    - **Accessory Image (Aksesuar Şəkli):** File Upload (Image) və ya Image URL inputi.
    - **Accessory Title (Aksesuar Adı/Başlığı):** Text Input (Məsələn: "HyperX Cloud II Qulaqlıq")
    - **Accessory Icon (Aksesuar İkonu):** İxtiyari icon picker (Xromatik dizayn üçün tələb olunan hər hansı köməkçi ikon).

### 🎨 UI/UX və Funksional Tələblər (AI üçün təlimat):
1. **Layout Strategy:** Səhifəni **"Categorized Accordion"** və ya **"Tabbed Cards"** formatında qurun. Bir çox "Səviyyə" (Elit, Standart) əlavə ediləndə səhifə çox qarışıq olmamalıdır.
2. **Dynamic Fields:** "Xüsusi Paketlər", "Təchizat Xüsusiyyətləri", və "Aksesuarlar" üçün aşkar "Əlavə et" (+) və "Sil" (zibil qutusu) ikonaları qoyun.
3. **Data Structure:** Formun yekun State strukturu mütləq obyektlərdən ibarət bir Array (List of Objects) olmalıdır. (JSON nümunəsi yazın).
4. **Design:** Çox müasir, təmiz, Admin kənarları olan (Dashboard-like sidebar/header daxil ola bilər) və istifadəsi rahat olan interfeys hazırlayın. Tailwind utilities istifadə edərək estetik qutu kölgələri (shadows), focus state-lər əlavə edin.

Xahiş edirəm bu tələblərə uyğun **tam funksional, state management həlli ilə (məs: React state və ya react-hook-form istifadə edərək) hazır Frontend kodunu** mənə qaytarın.
---
