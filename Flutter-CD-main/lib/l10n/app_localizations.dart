import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_az.dart';
import 'app_localizations_en.dart';
import 'app_localizations_ru.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('az'),
    Locale('en'),
    Locale('ru'),
  ];

  /// No description provided for @home.
  ///
  /// In az, this message translates to:
  /// **'Ana səhifə'**
  String get home;

  /// No description provided for @search.
  ///
  /// In az, this message translates to:
  /// **'Axtarış'**
  String get search;

  /// No description provided for @profile.
  ///
  /// In az, this message translates to:
  /// **'Profil'**
  String get profile;

  /// No description provided for @settings.
  ///
  /// In az, this message translates to:
  /// **'Ayarlar'**
  String get settings;

  /// No description provided for @language.
  ///
  /// In az, this message translates to:
  /// **'Dil'**
  String get language;

  /// No description provided for @logout.
  ///
  /// In az, this message translates to:
  /// **'Çıxış'**
  String get logout;

  /// No description provided for @login.
  ///
  /// In az, this message translates to:
  /// **'Giriş'**
  String get login;

  /// No description provided for @email.
  ///
  /// In az, this message translates to:
  /// **'E-poçt'**
  String get email;

  /// No description provided for @password.
  ///
  /// In az, this message translates to:
  /// **'Şifrə'**
  String get password;

  /// No description provided for @all.
  ///
  /// In az, this message translates to:
  /// **'Hamısı'**
  String get all;

  /// No description provided for @venues.
  ///
  /// In az, this message translates to:
  /// **'Məkanlar'**
  String get venues;

  /// No description provided for @favorites.
  ///
  /// In az, this message translates to:
  /// **'Seçilmişlər'**
  String get favorites;

  /// No description provided for @navMap.
  ///
  /// In az, this message translates to:
  /// **'Xəritə'**
  String get navMap;

  /// No description provided for @navSearch.
  ///
  /// In az, this message translates to:
  /// **'Axtarış'**
  String get navSearch;

  /// No description provided for @navFavorites.
  ///
  /// In az, this message translates to:
  /// **'Seçilmişlər'**
  String get navFavorites;

  /// No description provided for @navProfile.
  ///
  /// In az, this message translates to:
  /// **'Profil'**
  String get navProfile;

  /// No description provided for @searchBarHint.
  ///
  /// In az, this message translates to:
  /// **'Lounj, karaoke və ya internet klubları tap...'**
  String get searchBarHint;

  /// No description provided for @filterPlayStation.
  ///
  /// In az, this message translates to:
  /// **'PlayStation'**
  String get filterPlayStation;

  /// No description provided for @filterInternetClub.
  ///
  /// In az, this message translates to:
  /// **'İnternet Klubu'**
  String get filterInternetClub;

  /// No description provided for @filterOpenNow.
  ///
  /// In az, this message translates to:
  /// **'İndi Açıq'**
  String get filterOpenNow;

  /// No description provided for @searchTitle.
  ///
  /// In az, this message translates to:
  /// **'Axtarış'**
  String get searchTitle;

  /// No description provided for @searchVenuesHint.
  ///
  /// In az, this message translates to:
  /// **'Məkanları axtar...'**
  String get searchVenuesHint;

  /// No description provided for @nearbyResults.
  ///
  /// In az, this message translates to:
  /// **'YAXINLIQDA {count} NƏTİCƏ'**
  String nearbyResults(int count);

  /// No description provided for @sortAll.
  ///
  /// In az, this message translates to:
  /// **'SIRALA: HAMISI'**
  String get sortAll;

  /// No description provided for @sortAlphabeticalAZ.
  ///
  /// In az, this message translates to:
  /// **'A-Z (Əlifba sırası)'**
  String get sortAlphabeticalAZ;

  /// No description provided for @sortAlphabeticalZA.
  ///
  /// In az, this message translates to:
  /// **'Z-A (Tərs əlifba sırası)'**
  String get sortAlphabeticalZA;

  /// No description provided for @sortClosest.
  ///
  /// In az, this message translates to:
  /// **'Ən yaxın məkanlar'**
  String get sortClosest;

  /// No description provided for @sortNewest.
  ///
  /// In az, this message translates to:
  /// **'Ən yenilər'**
  String get sortNewest;

  /// No description provided for @sortTitle.
  ///
  /// In az, this message translates to:
  /// **'Sırala və Filtrlə'**
  String get sortTitle;

  /// No description provided for @noVenueFound.
  ///
  /// In az, this message translates to:
  /// **'Heç bir məkan tapılmadı'**
  String get noVenueFound;

  /// No description provided for @favoritesTitle.
  ///
  /// In az, this message translates to:
  /// **'Seçilmişləriniz'**
  String get favoritesTitle;

  /// No description provided for @favoritesSubtitle.
  ///
  /// In az, this message translates to:
  /// **'Sizin üçün özəl olan məkanlar, hamısı bir yerdə.'**
  String get favoritesSubtitle;

  /// No description provided for @searchInFavoritesHint.
  ///
  /// In az, this message translates to:
  /// **'Seçilmişlərdə axtar...'**
  String get searchInFavoritesHint;

  /// No description provided for @noFavoritesYet.
  ///
  /// In az, this message translates to:
  /// **'Hələ seçilmiş yoxdur'**
  String get noFavoritesYet;

  /// No description provided for @noFavoritesDescription.
  ///
  /// In az, this message translates to:
  /// **'Bəyəndiyiniz məkanları ürək ikonuna basaraq\nburaya əlavə edə bilərsiniz.'**
  String get noFavoritesDescription;

  /// No description provided for @reservations.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiyalar'**
  String get reservations;

  /// No description provided for @myReservations.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiyalarım'**
  String get myReservations;

  /// No description provided for @preferences.
  ///
  /// In az, this message translates to:
  /// **'Üstünlüklər'**
  String get preferences;

  /// No description provided for @notificationSettings.
  ///
  /// In az, this message translates to:
  /// **'Bildiriş tənzimləmələri'**
  String get notificationSettings;

  /// No description provided for @appLanguage.
  ///
  /// In az, this message translates to:
  /// **'Tətbiq dili'**
  String get appLanguage;

  /// No description provided for @support.
  ///
  /// In az, this message translates to:
  /// **'Dəstək'**
  String get support;

  /// No description provided for @editProfile.
  ///
  /// In az, this message translates to:
  /// **'Profili redaktə et'**
  String get editProfile;

  /// No description provided for @deleteAccount.
  ///
  /// In az, this message translates to:
  /// **'Hesabı sil'**
  String get deleteAccount;

  /// No description provided for @deleteAccountConfirm.
  ///
  /// In az, this message translates to:
  /// **'Hesabı silmək istəyirsiniz?'**
  String get deleteAccountConfirm;

  /// No description provided for @deleteAccountWarning.
  ///
  /// In az, this message translates to:
  /// **'Bu əməliyyat geri qaytarıla bilməz. Bütün məlumatlarınız, saxlanılan məkanlarınız və tənzimləmələriniz həmişəlik silinəcək.'**
  String get deleteAccountWarning;

  /// No description provided for @cancel.
  ///
  /// In az, this message translates to:
  /// **'İmtina et'**
  String get cancel;

  /// No description provided for @savedVenues.
  ///
  /// In az, this message translates to:
  /// **'SAXLANILAN MƏKANLAR'**
  String get savedVenues;

  /// No description provided for @discovered.
  ///
  /// In az, this message translates to:
  /// **'KƏŞF EDİLDİ'**
  String get discovered;

  /// No description provided for @versionInfo.
  ///
  /// In az, this message translates to:
  /// **'VERSİYA 2.4.1 (BUILD 890)'**
  String get versionInfo;

  /// No description provided for @openNow.
  ///
  /// In az, this message translates to:
  /// **'İndi açıqdır'**
  String get openNow;

  /// No description provided for @venueClosed.
  ///
  /// In az, this message translates to:
  /// **'Məkan Bağlıdır'**
  String get venueClosed;

  /// No description provided for @venue.
  ///
  /// In az, this message translates to:
  /// **'Məkan'**
  String get venue;

  /// No description provided for @gameRoom.
  ///
  /// In az, this message translates to:
  /// **'Oyun Zalı'**
  String get gameRoom;

  /// No description provided for @errorOccurred.
  ///
  /// In az, this message translates to:
  /// **'Xəta baş verdi'**
  String get errorOccurred;

  /// No description provided for @azerbaijaniLanguage.
  ///
  /// In az, this message translates to:
  /// **'Azərbaycan dili'**
  String get azerbaijaniLanguage;

  /// No description provided for @englishLanguage.
  ///
  /// In az, this message translates to:
  /// **'English'**
  String get englishLanguage;

  /// No description provided for @russianLanguage.
  ///
  /// In az, this message translates to:
  /// **'Русский'**
  String get russianLanguage;

  /// No description provided for @selectLanguage.
  ///
  /// In az, this message translates to:
  /// **'Dil seçin'**
  String get selectLanguage;

  /// No description provided for @temporarilyClosed.
  ///
  /// In az, this message translates to:
  /// **'Müvəqqəti bağlıdır'**
  String get temporarilyClosed;

  /// No description provided for @perHour.
  ///
  /// In az, this message translates to:
  /// **'/saat'**
  String get perHour;

  /// No description provided for @startingPrice.
  ///
  /// In az, this message translates to:
  /// **'BAŞLANĞIC QİYMƏT'**
  String get startingPrice;

  /// No description provided for @details.
  ///
  /// In az, this message translates to:
  /// **'Ətraflı'**
  String get details;

  /// No description provided for @nowOpen.
  ///
  /// In az, this message translates to:
  /// **'İNDİ AÇIQDIR'**
  String get nowOpen;

  /// No description provided for @closedCaps.
  ///
  /// In az, this message translates to:
  /// **'BAĞLIDIR'**
  String get closedCaps;

  /// No description provided for @venueCurrentlyClosed.
  ///
  /// In az, this message translates to:
  /// **'Məkan hazırda bağlıdır'**
  String get venueCurrentlyClosed;

  /// No description provided for @venueFull.
  ///
  /// In az, this message translates to:
  /// **'Məkan Doludur'**
  String get venueFull;

  /// No description provided for @bookNow.
  ///
  /// In az, this message translates to:
  /// **'Rezerv et'**
  String get bookNow;

  /// No description provided for @venueNamePlaceholder.
  ///
  /// In az, this message translates to:
  /// **'Məkan Adı'**
  String get venueNamePlaceholder;

  /// No description provided for @bakuAzerbaijan.
  ///
  /// In az, this message translates to:
  /// **'Bakı, Azərbaycan'**
  String get bakuAzerbaijan;

  /// No description provided for @alwaysOpen.
  ///
  /// In az, this message translates to:
  /// **'Həmişə açıqdır'**
  String get alwaysOpen;

  /// No description provided for @viewWorkingHours.
  ///
  /// In az, this message translates to:
  /// **'İş saatları mövcuddur'**
  String get viewWorkingHours;

  /// No description provided for @call.
  ///
  /// In az, this message translates to:
  /// **'Zəng et'**
  String get call;

  /// No description provided for @address.
  ///
  /// In az, this message translates to:
  /// **'Ünvan'**
  String get address;

  /// No description provided for @priceTitle.
  ///
  /// In az, this message translates to:
  /// **'Qiymət'**
  String get priceTitle;

  /// No description provided for @menu.
  ///
  /// In az, this message translates to:
  /// **'Menyu'**
  String get menu;

  /// No description provided for @about.
  ///
  /// In az, this message translates to:
  /// **'Haqqında'**
  String get about;

  /// No description provided for @noDescription.
  ///
  /// In az, this message translates to:
  /// **'Məkan haqqında məlumat yoxdur.'**
  String get noDescription;

  /// No description provided for @workingHours.
  ///
  /// In az, this message translates to:
  /// **'İş Saatları'**
  String get workingHours;

  /// No description provided for @alwaysOpen24_7.
  ///
  /// In az, this message translates to:
  /// **'24/7 - Həmişə açıqdır'**
  String get alwaysOpen24_7;

  /// No description provided for @note.
  ///
  /// In az, this message translates to:
  /// **'Qeyd'**
  String get note;

  /// No description provided for @allDay.
  ///
  /// In az, this message translates to:
  /// **'24 SAAT'**
  String get allDay;

  /// No description provided for @services.
  ///
  /// In az, this message translates to:
  /// **'Xidmətlər'**
  String get services;

  /// No description provided for @allFeatures.
  ///
  /// In az, this message translates to:
  /// **'Məkanın təklif etdiyi bütün xüsusiyyətlər'**
  String get allFeatures;

  /// No description provided for @gallery.
  ///
  /// In az, this message translates to:
  /// **'Qalereya'**
  String get gallery;

  /// No description provided for @imagesFromVenue.
  ///
  /// In az, this message translates to:
  /// **'Məkandan görüntülər'**
  String get imagesFromVenue;

  /// No description provided for @map.
  ///
  /// In az, this message translates to:
  /// **'Xəritə'**
  String get map;

  /// No description provided for @openInMap.
  ///
  /// In az, this message translates to:
  /// **'Xəritədə aç'**
  String get openInMap;

  /// No description provided for @mapDescription.
  ///
  /// In az, this message translates to:
  /// **'Bu düyməyə basaraq məkanı xəritədə görə və yol tarifi ala bilərsiniz.'**
  String get mapDescription;

  /// No description provided for @monday.
  ///
  /// In az, this message translates to:
  /// **'Bazar ertəsi'**
  String get monday;

  /// No description provided for @tuesday.
  ///
  /// In az, this message translates to:
  /// **'Çərşənbə axşamı'**
  String get tuesday;

  /// No description provided for @wednesday.
  ///
  /// In az, this message translates to:
  /// **'Çərşənbə'**
  String get wednesday;

  /// No description provided for @thursday.
  ///
  /// In az, this message translates to:
  /// **'Cümə axşamı'**
  String get thursday;

  /// No description provided for @friday.
  ///
  /// In az, this message translates to:
  /// **'Cümə'**
  String get friday;

  /// No description provided for @saturday.
  ///
  /// In az, this message translates to:
  /// **'Şənbə'**
  String get saturday;

  /// No description provided for @sunday.
  ///
  /// In az, this message translates to:
  /// **'Bazar'**
  String get sunday;

  /// No description provided for @closedSchedule.
  ///
  /// In az, this message translates to:
  /// **'Bağlıdır'**
  String get closedSchedule;

  /// No description provided for @availableAmenity.
  ///
  /// In az, this message translates to:
  /// **'Mövcuddur'**
  String get availableAmenity;

  /// No description provided for @venueGallery.
  ///
  /// In az, this message translates to:
  /// **'Məkan Qalereyası'**
  String get venueGallery;

  /// No description provided for @viewAll.
  ///
  /// In az, this message translates to:
  /// **'Hamısına bax'**
  String get viewAll;

  /// No description provided for @allPhotos.
  ///
  /// In az, this message translates to:
  /// **'Bütün Fotolar'**
  String get allPhotos;

  /// No description provided for @venueTemporarilyClosedMsg.
  ///
  /// In az, this message translates to:
  /// **'Məkan müvəqqəti bağlandı'**
  String get venueTemporarilyClosedMsg;

  /// No description provided for @venueFullMsg.
  ///
  /// In az, this message translates to:
  /// **'Məkan Doludur'**
  String get venueFullMsg;

  /// No description provided for @venueClosedByClockMsg.
  ///
  /// In az, this message translates to:
  /// **'Məkan Bağlandı'**
  String get venueClosedByClockMsg;

  /// No description provided for @venueClosedDescription.
  ///
  /// In az, this message translates to:
  /// **'Məkan saat tamam olduğu üçün bağlandı. Rezervasiya qəbul edilmir.'**
  String get venueClosedDescription;

  /// No description provided for @venueOwnerStoppedReservations.
  ///
  /// In az, this message translates to:
  /// **'Təəssüf ki, məkan sahibi bu an üçün rezervasiyaları dayandırdı. Zəhmət olmasa daha sonra yenidən cəhd edin.'**
  String get venueOwnerStoppedReservations;

  /// No description provided for @goBack.
  ///
  /// In az, this message translates to:
  /// **'Geri Qayıt'**
  String get goBack;

  /// No description provided for @pleaseFillAllFields.
  ///
  /// In az, this message translates to:
  /// **'Zəhmət olmasa bütün sahələri doldurun'**
  String get pleaseFillAllFields;

  /// No description provided for @cannotBookPastTime.
  ///
  /// In az, this message translates to:
  /// **'Keçmiş vaxt üçün rezervasiya etmək olmaz'**
  String get cannotBookPastTime;

  /// No description provided for @user.
  ///
  /// In az, this message translates to:
  /// **'İstifadəçi'**
  String get user;

  /// No description provided for @errorOccurredTryAgain.
  ///
  /// In az, this message translates to:
  /// **'Xəta baş verdi. Yenidən cəhd edin.'**
  String get errorOccurredTryAgain;

  /// No description provided for @activeReservationSameVenue.
  ///
  /// In az, this message translates to:
  /// **'Hazırda bu məkana aktiv rezervasiyanız var. Əvvəlcə mövcud rezervasiyanızı ləğv edin.'**
  String get activeReservationSameVenue;

  /// No description provided for @activeReservationOtherVenue.
  ///
  /// In az, this message translates to:
  /// **'Hazırda başqa məkana aid aktiv rezervasiyanız var. Əvvəlcə mövcud rezervasiyanızı ləğv edin.'**
  String get activeReservationOtherVenue;

  /// No description provided for @attention.
  ///
  /// In az, this message translates to:
  /// **'Diqqət!'**
  String get attention;

  /// No description provided for @iUnderstand.
  ///
  /// In az, this message translates to:
  /// **'Anladım'**
  String get iUnderstand;

  /// No description provided for @blockedByVenue.
  ///
  /// In az, this message translates to:
  /// **'Siz bu məkan tərəfindən bloklanmısınız!'**
  String get blockedByVenue;

  /// No description provided for @blockedByVenueDesc.
  ///
  /// In az, this message translates to:
  /// **'Təəssüf ki, bu məkan sizin rezervasiya etməyinizi məhdudlaşdırıb. Daha ətraflı məlumat üçün məkanla əlaqə saxlaya bilərsiniz.'**
  String get blockedByVenueDesc;

  /// No description provided for @reserveSpot.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiya'**
  String get reserveSpot;

  /// No description provided for @dateTitle.
  ///
  /// In az, this message translates to:
  /// **'Tarix'**
  String get dateTitle;

  /// No description provided for @today.
  ///
  /// In az, this message translates to:
  /// **'Bugün'**
  String get today;

  /// No description provided for @mobileNumber.
  ///
  /// In az, this message translates to:
  /// **'Mobil Nömrə'**
  String get mobileNumber;

  /// No description provided for @fieldRequired.
  ///
  /// In az, this message translates to:
  /// **'* Bu hissə mütləqdir'**
  String get fieldRequired;

  /// No description provided for @timeTitle.
  ///
  /// In az, this message translates to:
  /// **'Vaxt'**
  String get timeTitle;

  /// No description provided for @additionalNote.
  ///
  /// In az, this message translates to:
  /// **'Əlavə Qeyd'**
  String get additionalNote;

  /// No description provided for @noteHint.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiya üçün əlavə istəklərinizi bura daxil edin...'**
  String get noteHint;

  /// No description provided for @tierSelection.
  ///
  /// In az, this message translates to:
  /// **'Tier Seçimi'**
  String get tierSelection;

  /// No description provided for @standardSetup.
  ///
  /// In az, this message translates to:
  /// **'Standard Setup'**
  String get standardSetup;

  /// No description provided for @tierNotSelected.
  ///
  /// In az, this message translates to:
  /// **'Tier seçilməyib'**
  String get tierNotSelected;

  /// No description provided for @total.
  ///
  /// In az, this message translates to:
  /// **'Cəmi'**
  String get total;

  /// No description provided for @confirmReservation.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiyanı Təsdiqlə'**
  String get confirmReservation;

  /// No description provided for @reservationSuccess.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiya uğurla göndərildi!'**
  String get reservationSuccess;

  /// No description provided for @reservationSuccessMsg.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiyanız qəbul edildi. Təsdiq üçün sizinlə əlaqə saxlanılacaq.'**
  String get reservationSuccessMsg;

  /// No description provided for @reservationSent.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiya uğurla\ngöndərildi!'**
  String get reservationSent;

  /// No description provided for @checkReservationsUnderProfile.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiyanın statusuna baxmaq üçün Profil bölməsində \"Rezervasiyalarım\" hissəsinə keçin.'**
  String get checkReservationsUnderProfile;

  /// No description provided for @statusPending.
  ///
  /// In az, this message translates to:
  /// **'Status: Gözləyir'**
  String get statusPending;

  /// No description provided for @provideDetailsAtVenue.
  ///
  /// In az, this message translates to:
  /// **'Məkana daxil olarkən nömrə və ya rezervasiya nömrəsini təqdim edin'**
  String get provideDetailsAtVenue;

  /// No description provided for @january.
  ///
  /// In az, this message translates to:
  /// **'Yanvar'**
  String get january;

  /// No description provided for @february.
  ///
  /// In az, this message translates to:
  /// **'Fevral'**
  String get february;

  /// No description provided for @march.
  ///
  /// In az, this message translates to:
  /// **'Mart'**
  String get march;

  /// No description provided for @april.
  ///
  /// In az, this message translates to:
  /// **'Aprel'**
  String get april;

  /// No description provided for @may.
  ///
  /// In az, this message translates to:
  /// **'May'**
  String get may;

  /// No description provided for @june.
  ///
  /// In az, this message translates to:
  /// **'İyun'**
  String get june;

  /// No description provided for @july.
  ///
  /// In az, this message translates to:
  /// **'İyul'**
  String get july;

  /// No description provided for @august.
  ///
  /// In az, this message translates to:
  /// **'Avqust'**
  String get august;

  /// No description provided for @september.
  ///
  /// In az, this message translates to:
  /// **'Sentyabr'**
  String get september;

  /// No description provided for @october.
  ///
  /// In az, this message translates to:
  /// **'Oktyabr'**
  String get october;

  /// No description provided for @november.
  ///
  /// In az, this message translates to:
  /// **'Noyabr'**
  String get november;

  /// No description provided for @december.
  ///
  /// In az, this message translates to:
  /// **'Dekabr'**
  String get december;

  /// No description provided for @menuNotAvailable.
  ///
  /// In az, this message translates to:
  /// **'Menyu mövcud deyil'**
  String get menuNotAvailable;

  /// No description provided for @emptyMenu.
  ///
  /// In az, this message translates to:
  /// **'Bu məkanın menyusu boşdur.'**
  String get emptyMenu;

  /// No description provided for @itemsAvailable.
  ///
  /// In az, this message translates to:
  /// **'{count} Növ Mövcuddur'**
  String itemsAvailable(Object count);

  /// No description provided for @noProductsInCategory.
  ///
  /// In az, this message translates to:
  /// **'Bu kateqoriyada məhsul tapılmadı.'**
  String get noProductsInCategory;

  /// No description provided for @ratesNotAvailable.
  ///
  /// In az, this message translates to:
  /// **'Qiymətlər mövcud deyil'**
  String get ratesNotAvailable;

  /// No description provided for @standardRates.
  ///
  /// In az, this message translates to:
  /// **'Standart Qiymətlər'**
  String get standardRates;

  /// No description provided for @pricingInfo.
  ///
  /// In az, this message translates to:
  /// **'Qiymət Məlumatı'**
  String get pricingInfo;

  /// No description provided for @perUnit.
  ///
  /// In az, this message translates to:
  /// **'/ {unit}'**
  String perUnit(Object unit);

  /// No description provided for @ratesAndPackages.
  ///
  /// In az, this message translates to:
  /// **'Qiymətlər və Paketlər'**
  String get ratesAndPackages;

  /// No description provided for @gamingRates.
  ///
  /// In az, this message translates to:
  /// **'Oyun Qiymətləri'**
  String get gamingRates;

  /// No description provided for @hourlyCaps.
  ///
  /// In az, this message translates to:
  /// **'SAATLIQ'**
  String get hourlyCaps;

  /// No description provided for @unnamedTier.
  ///
  /// In az, this message translates to:
  /// **'Adsız Tier'**
  String get unnamedTier;

  /// No description provided for @specialPackages.
  ///
  /// In az, this message translates to:
  /// **'Xüsusi Paketlər'**
  String get specialPackages;

  /// No description provided for @discountedWithPercent.
  ///
  /// In az, this message translates to:
  /// **'ENDİRİMLİ - %{percent}'**
  String discountedWithPercent(Object percent);

  /// No description provided for @discounted.
  ///
  /// In az, this message translates to:
  /// **'ENDİRİMLİ'**
  String get discounted;

  /// No description provided for @userNotFound.
  ///
  /// In az, this message translates to:
  /// **'İstifadəçi məlumatı tapılmadı'**
  String get userNotFound;

  /// No description provided for @accepted.
  ///
  /// In az, this message translates to:
  /// **'Qəbul edildi'**
  String get accepted;

  /// No description provided for @rejected.
  ///
  /// In az, this message translates to:
  /// **'Rədd edildi'**
  String get rejected;

  /// No description provided for @canceled.
  ///
  /// In az, this message translates to:
  /// **'Ləğv edildi'**
  String get canceled;

  /// No description provided for @pending.
  ///
  /// In az, this message translates to:
  /// **'Gözləyir'**
  String get pending;

  /// No description provided for @retry.
  ///
  /// In az, this message translates to:
  /// **'Yenidən yoxla'**
  String get retry;

  /// No description provided for @noReservationsYet.
  ///
  /// In az, this message translates to:
  /// **'Hələ rezervasiyanız yoxdur'**
  String get noReservationsYet;

  /// No description provided for @canBookFromVenuePage.
  ///
  /// In az, this message translates to:
  /// **'Məkan səhifəsindən rezervasiya edə bilərsiniz'**
  String get canBookFromVenuePage;

  /// No description provided for @cancelReservationConfirmTitle.
  ///
  /// In az, this message translates to:
  /// **'Ləğv etmək'**
  String get cancelReservationConfirmTitle;

  /// No description provided for @cancelReservationConfirmMessage.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiyanızı ləğv etmək istəyirsiniz?'**
  String get cancelReservationConfirmMessage;

  /// No description provided for @no.
  ///
  /// In az, this message translates to:
  /// **'Xeyr'**
  String get no;

  /// No description provided for @yesCancel.
  ///
  /// In az, this message translates to:
  /// **'Bəli, ləğv et'**
  String get yesCancel;

  /// No description provided for @reservationCode.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiya Kodu: #{code}'**
  String reservationCode(Object code);

  /// No description provided for @peopleCount.
  ///
  /// In az, this message translates to:
  /// **'{count} nəfər'**
  String peopleCount(Object count);

  /// No description provided for @cancelReservationBtn.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiyanı Ləğv Et'**
  String get cancelReservationBtn;

  /// No description provided for @editProfileTitle.
  ///
  /// In az, this message translates to:
  /// **'Profili redaktə et'**
  String get editProfileTitle;

  /// No description provided for @save.
  ///
  /// In az, this message translates to:
  /// **'Yadda saxla'**
  String get save;

  /// No description provided for @editProfileNotice.
  ///
  /// In az, this message translates to:
  /// **'Profil məlumatlarınızı yeniləmək təsdiqlənmə statusunuza təsir edə bilər. Bütün məlumatların düzgün olduğundan əmin olun.'**
  String get editProfileNotice;

  /// No description provided for @changePhoto.
  ///
  /// In az, this message translates to:
  /// **'Şəkli dəyiş'**
  String get changePhoto;

  /// No description provided for @personalInfoGroup.
  ///
  /// In az, this message translates to:
  /// **'ŞƏXSİ MƏLUMATLAR'**
  String get personalInfoGroup;

  /// No description provided for @nameLabel.
  ///
  /// In az, this message translates to:
  /// **'Ad'**
  String get nameLabel;

  /// No description provided for @yourIdentity.
  ///
  /// In az, this message translates to:
  /// **'Sizin Kimliyiniz'**
  String get yourIdentity;

  /// No description provided for @identityDescription.
  ///
  /// In az, this message translates to:
  /// **'Digər istifadəçilər və məkanlar sizi platformada bu şəkildə görəcəklər.'**
  String get identityDescription;

  /// No description provided for @fullNameLabel.
  ///
  /// In az, this message translates to:
  /// **'TAM ADINIZ'**
  String get fullNameLabel;

  /// No description provided for @enterNameHint.
  ///
  /// In az, this message translates to:
  /// **'Adınızı daxil edin'**
  String get enterNameHint;

  /// No description provided for @identityNotice.
  ///
  /// In az, this message translates to:
  /// **'Həqiqi adınızdan istifadə etməyiniz icma daxilində inam yaratmağa kömək edir. Bunu 30 gündə bir dəfə dəyişə bilərsiniz.'**
  String get identityNotice;

  /// No description provided for @previewLabel.
  ///
  /// In az, this message translates to:
  /// **'ÖN BAXIŞ'**
  String get previewLabel;

  /// No description provided for @memberSince.
  ///
  /// In az, this message translates to:
  /// **'{date}-CÜ İLDƏN ÜZV'**
  String memberSince(Object date);

  /// No description provided for @updatePhoneTitle.
  ///
  /// In az, this message translates to:
  /// **'Telefon nömrənizi yeniləyin'**
  String get updatePhoneTitle;

  /// No description provided for @updatePhoneDescription.
  ///
  /// In az, this message translates to:
  /// **'Hesabınızı təhlükəsiz saxlamaq üçün bu nömrəyə təsdiq kodu göndərəcəyik. Mesajlaşma tarifləri tətbiq oluna bilər.'**
  String get updatePhoneDescription;

  /// No description provided for @phoneNumberLabel.
  ///
  /// In az, this message translates to:
  /// **'MOBİL NÖMRƏ'**
  String get phoneNumberLabel;

  /// No description provided for @phoneHint.
  ///
  /// In az, this message translates to:
  /// **'(555) 000-0000'**
  String get phoneHint;

  /// No description provided for @twoFactorAuth.
  ///
  /// In az, this message translates to:
  /// **'İki Faktorlu Doğrulama'**
  String get twoFactorAuth;

  /// No description provided for @twoFactorDescription.
  ///
  /// In az, this message translates to:
  /// **'Məlumatlarınızın məxfi və qorunan olmasını təmin etmək üçün bu nömrə iki faktorlu identifikasiya üçün istifadə olunacaq.'**
  String get twoFactorDescription;

  /// No description provided for @confirmNumberBtn.
  ///
  /// In az, this message translates to:
  /// **'Nömrəni təsdiqlə'**
  String get confirmNumberBtn;

  /// No description provided for @changedMind.
  ///
  /// In az, this message translates to:
  /// **'Fikrinizi dəyişdiniz? '**
  String get changedMind;

  /// No description provided for @secureCloud.
  ///
  /// In az, this message translates to:
  /// **'TƏHLÜKƏSİZ BULUD'**
  String get secureCloud;

  /// No description provided for @encrypted.
  ///
  /// In az, this message translates to:
  /// **'ŞİFRƏLƏNMİŞ'**
  String get encrypted;

  /// No description provided for @updateEmailTitle.
  ///
  /// In az, this message translates to:
  /// **'E-poçt yenilə'**
  String get updateEmailTitle;

  /// No description provided for @updateEmailDescription.
  ///
  /// In az, this message translates to:
  /// **'Aşağıda yeni e-poçt ünvanınızı daxil edin. Hesabınızın təhlükəsiz qalmasını təmin etmək üçün təsdiq linki göndərəcəyik.'**
  String get updateEmailDescription;

  /// No description provided for @currentEmailLabel.
  ///
  /// In az, this message translates to:
  /// **'CARİ E-POÇT'**
  String get currentEmailLabel;

  /// No description provided for @enterEmailHint.
  ///
  /// In az, this message translates to:
  /// **'Yeni e-poçt daxil edin'**
  String get enterEmailHint;

  /// No description provided for @verificationProcess.
  ///
  /// In az, this message translates to:
  /// **'Doğrulama Prosesi'**
  String get verificationProcess;

  /// No description provided for @verificationProcessDescription.
  ///
  /// In az, this message translates to:
  /// **'Yadda saxladıqdan sonra yeni ünvanınıza təsdiq linki göndəriləcək. E-poçtunuz yalnız siz dəyişikliyi təsdiqlədikdən sonra yenilənəcək.'**
  String get verificationProcessDescription;

  /// No description provided for @securityCheckStarted.
  ///
  /// In az, this message translates to:
  /// **'Təhlükəsizlik yoxlanışı başladı'**
  String get securityCheckStarted;

  /// No description provided for @linkValid24Hours.
  ///
  /// In az, this message translates to:
  /// **'Link 24 saat qüvvədədir'**
  String get linkValid24Hours;

  /// No description provided for @privacyObjective.
  ///
  /// In az, this message translates to:
  /// **'MƏXFİLİK İLK MƏQSƏDDİR'**
  String get privacyObjective;

  /// No description provided for @dataEncrypted.
  ///
  /// In az, this message translates to:
  /// **'Məlumatlarınız uçdan-uca şifrələnir.'**
  String get dataEncrypted;

  /// No description provided for @loginErrorEmpty.
  ///
  /// In az, this message translates to:
  /// **'Email və şifrəni daxil edin.'**
  String get loginErrorEmpty;

  /// No description provided for @loginErrorInvalid.
  ///
  /// In az, this message translates to:
  /// **'Yanlış email və ya şifrə.'**
  String get loginErrorInvalid;

  /// No description provided for @loginErrorNetwork.
  ///
  /// In az, this message translates to:
  /// **'Şəbəkə xətası. Yenidən cəhd edin.'**
  String get loginErrorNetwork;

  /// No description provided for @loginSubtitle.
  ///
  /// In az, this message translates to:
  /// **'Kürasiya dünyanıza daxil olun'**
  String get loginSubtitle;

  /// No description provided for @emailAddressLabel.
  ///
  /// In az, this message translates to:
  /// **'E-POÇT ÜNVANI'**
  String get emailAddressLabel;

  /// No description provided for @emailHint.
  ///
  /// In az, this message translates to:
  /// **'ad@misal.com'**
  String get emailHint;

  /// No description provided for @passwordLabel.
  ///
  /// In az, this message translates to:
  /// **'ŞİFRƏ'**
  String get passwordLabel;

  /// No description provided for @forgotPasswordBtn.
  ///
  /// In az, this message translates to:
  /// **'ŞİFRƏNİ UNUTDUNUZ?'**
  String get forgotPasswordBtn;

  /// No description provided for @signInBtn.
  ///
  /// In az, this message translates to:
  /// **'Daxil ol'**
  String get signInBtn;

  /// No description provided for @orContinueWith.
  ///
  /// In az, this message translates to:
  /// **'VƏ YA BUNUNLA DAVAM ET'**
  String get orContinueWith;

  /// No description provided for @donthaveAccount.
  ///
  /// In az, this message translates to:
  /// **'Hesabınız yoxdur?'**
  String get donthaveAccount;

  /// No description provided for @signUpBtn.
  ///
  /// In az, this message translates to:
  /// **'Qeydiyyatdan keç'**
  String get signUpBtn;

  /// No description provided for @registerErrorEmpty.
  ///
  /// In az, this message translates to:
  /// **'Bütün sahələri doldurun.'**
  String get registerErrorEmpty;

  /// No description provided for @registerErrorPasswordShort.
  ///
  /// In az, this message translates to:
  /// **'Şifrə ən azı 6 simvoldan ibarət olmalıdır.'**
  String get registerErrorPasswordShort;

  /// No description provided for @registerErrorPasswordsDontMatch.
  ///
  /// In az, this message translates to:
  /// **'Şifrələr uyğun gəlmir.'**
  String get registerErrorPasswordsDontMatch;

  /// No description provided for @registerErrorGeneral.
  ///
  /// In az, this message translates to:
  /// **'Xəta baş verdi.'**
  String get registerErrorGeneral;

  /// No description provided for @registerSubtitle.
  ///
  /// In az, this message translates to:
  /// **'Kürasiya səyahətinizə başlamaq üçün hesab yaradın.'**
  String get registerSubtitle;

  /// No description provided for @fullNameLabelCaps.
  ///
  /// In az, this message translates to:
  /// **'Tam Ad'**
  String get fullNameLabelCaps;

  /// No description provided for @emailLabel.
  ///
  /// In az, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @passwordHintLength.
  ///
  /// In az, this message translates to:
  /// **'Ən azı 8 simvol'**
  String get passwordHintLength;

  /// No description provided for @confirmPasswordLabel.
  ///
  /// In az, this message translates to:
  /// **'Şifrəni təsdiqlə'**
  String get confirmPasswordLabel;

  /// No description provided for @repeatPasswordHint.
  ///
  /// In az, this message translates to:
  /// **'Şifrəni təkrarlayın'**
  String get repeatPasswordHint;

  /// No description provided for @createAccountBtn.
  ///
  /// In az, this message translates to:
  /// **'Hesab Yarat'**
  String get createAccountBtn;

  /// No description provided for @or.
  ///
  /// In az, this message translates to:
  /// **'və ya'**
  String get or;

  /// No description provided for @continueWithGoogle.
  ///
  /// In az, this message translates to:
  /// **'Google ilə davam et'**
  String get continueWithGoogle;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In az, this message translates to:
  /// **'Artıq hesabınız var?'**
  String get alreadyHaveAccount;

  /// No description provided for @logInBtn.
  ///
  /// In az, this message translates to:
  /// **'Giriş'**
  String get logInBtn;

  /// No description provided for @privacyPolicy.
  ///
  /// In az, this message translates to:
  /// **'MƏXFİLİK SİYASƏTİ'**
  String get privacyPolicy;

  /// No description provided for @termsOfService.
  ///
  /// In az, this message translates to:
  /// **'İSTİFADƏ ŞƏRTLƏRİ'**
  String get termsOfService;

  /// No description provided for @forgotPasswordHero.
  ///
  /// In az, this message translates to:
  /// **'Şifrəni Unutdunuz?'**
  String get forgotPasswordHero;

  /// No description provided for @forgotPasswordSubtitle.
  ///
  /// In az, this message translates to:
  /// **'E-poçt ünvanınızı daxil edin, sizə şifrə sıfırlama kodu göndərəcəyik.'**
  String get forgotPasswordSubtitle;

  /// No description provided for @emailHintForgot.
  ///
  /// In az, this message translates to:
  /// **'salam@misal.com'**
  String get emailHintForgot;

  /// No description provided for @sendResetCodeBtn.
  ///
  /// In az, this message translates to:
  /// **'Sıfırlama Kodu Göndər'**
  String get sendResetCodeBtn;

  /// No description provided for @backToLogin.
  ///
  /// In az, this message translates to:
  /// **'Girişə Qayıt'**
  String get backToLogin;

  /// No description provided for @enterEmailError.
  ///
  /// In az, this message translates to:
  /// **'Email ünvanını daxil edin.'**
  String get enterEmailError;

  /// No description provided for @resetPasswordErrorLength.
  ///
  /// In az, this message translates to:
  /// **'Sıfırlama kodu 6 rəqəmli olmalıdır.'**
  String get resetPasswordErrorLength;

  /// No description provided for @passwordSuccess.
  ///
  /// In az, this message translates to:
  /// **'Şifrəniz uğurla yeniləndi!'**
  String get passwordSuccess;

  /// No description provided for @resetPasswordTitleAppbar.
  ///
  /// In az, this message translates to:
  /// **'Şifrə Sıfırlama'**
  String get resetPasswordTitleAppbar;

  /// No description provided for @setNewPasswordHeader.
  ///
  /// In az, this message translates to:
  /// **'Yeni Şifrə Təyin Edin'**
  String get setNewPasswordHeader;

  /// No description provided for @resetCodeSentText.
  ///
  /// In az, this message translates to:
  /// **'Sıfırlama kodu {email} ünvanına göndərildi.'**
  String resetCodeSentText(Object email);

  /// No description provided for @resetCodeLabel.
  ///
  /// In az, this message translates to:
  /// **'SIFIRLAMA KODU'**
  String get resetCodeLabel;

  /// No description provided for @newPasswordLabel.
  ///
  /// In az, this message translates to:
  /// **'YENİ ŞİFRƏ'**
  String get newPasswordLabel;

  /// No description provided for @passwordHintMinLength.
  ///
  /// In az, this message translates to:
  /// **'Ən azı 6 simvol'**
  String get passwordHintMinLength;

  /// No description provided for @confirmPasswordLabelCaps.
  ///
  /// In az, this message translates to:
  /// **'ŞİFRƏNİ TƏSDIQLƏ'**
  String get confirmPasswordLabelCaps;

  /// No description provided for @updatePasswordBtn.
  ///
  /// In az, this message translates to:
  /// **'Şifrəni Yenilə'**
  String get updatePasswordBtn;

  /// No description provided for @verificationTitle.
  ///
  /// In az, this message translates to:
  /// **'Doğrulama'**
  String get verificationTitle;

  /// No description provided for @checkEmailHero.
  ///
  /// In az, this message translates to:
  /// **'E-poçtunuzu yoxlayın'**
  String get checkEmailHero;

  /// No description provided for @otpSentText.
  ///
  /// In az, this message translates to:
  /// **'6 rəqəmli doğrulama kodu {email} ünvanına göndərildi.'**
  String otpSentText(Object email);

  /// No description provided for @verifyBtn.
  ///
  /// In az, this message translates to:
  /// **'Doğrula'**
  String get verifyBtn;

  /// No description provided for @didntReceiveCode.
  ///
  /// In az, this message translates to:
  /// **'Kod gəlmədi? '**
  String get didntReceiveCode;

  /// No description provided for @resendIn.
  ///
  /// In az, this message translates to:
  /// **'{seconds}s sonra yenidən göndər'**
  String resendIn(Object seconds);

  /// No description provided for @resendBtn.
  ///
  /// In az, this message translates to:
  /// **'Yenidən göndər'**
  String get resendBtn;

  /// No description provided for @skip.
  ///
  /// In az, this message translates to:
  /// **'Ötür'**
  String get skip;

  /// No description provided for @getStarted.
  ///
  /// In az, this message translates to:
  /// **'Başla'**
  String get getStarted;

  /// No description provided for @next.
  ///
  /// In az, this message translates to:
  /// **'Növbəti'**
  String get next;

  /// No description provided for @onboardingStep1Title.
  ///
  /// In az, this message translates to:
  /// **'Ətrafınızı Kəşf Edin'**
  String get onboardingStep1Title;

  /// No description provided for @onboardingStep1Subtitle.
  ///
  /// In az, this message translates to:
  /// **'Ən yaxşı internet klubları, PlayStation zonalarını və karaoke barlarını xəritənizdə tapın.'**
  String get onboardingStep1Subtitle;

  /// No description provided for @onboardingStep2Title.
  ///
  /// In az, this message translates to:
  /// **'Reytinqləri Müqayisə Edin'**
  String get onboardingStep2Title;

  /// No description provided for @onboardingStep2Subtitle.
  ///
  /// In az, this message translates to:
  /// **'Gecənizi mükəmməl keçirmək üçün reytinqləri, qiymətləri və mövcud xidmətləri müqayisə edin.'**
  String get onboardingStep2Subtitle;

  /// No description provided for @onboardingStep3Title.
  ///
  /// In az, this message translates to:
  /// **'Rezerv Et və Get'**
  String get onboardingStep3Title;

  /// No description provided for @onboardingStep3Subtitle.
  ///
  /// In az, this message translates to:
  /// **'Saniyələr ərzində yerinizi bron edin və təyinat yerinə dərhal yol tarifi alın.'**
  String get onboardingStep3Subtitle;

  /// No description provided for @reserved.
  ///
  /// In az, this message translates to:
  /// **'REZERV EDİLDİ'**
  String get reserved;

  /// No description provided for @getDirections.
  ///
  /// In az, this message translates to:
  /// **'İstiqamət Al'**
  String get getDirections;

  /// No description provided for @liveEventNearby.
  ///
  /// In az, this message translates to:
  /// **'Yaxınlıqda Canlı Tədbir'**
  String get liveEventNearby;

  /// No description provided for @trending.
  ///
  /// In az, this message translates to:
  /// **'TREND'**
  String get trending;

  /// No description provided for @arrivalTimeLabel.
  ///
  /// In az, this message translates to:
  /// **'Gəliş Vaxtı'**
  String get arrivalTimeLabel;

  /// No description provided for @partySizeLabel.
  ///
  /// In az, this message translates to:
  /// **'Qonaq Sayı'**
  String get partySizeLabel;

  /// No description provided for @todayAt.
  ///
  /// In az, this message translates to:
  /// **'Bu gün, {time}'**
  String todayAt(Object time);

  /// No description provided for @numGuests.
  ///
  /// In az, this message translates to:
  /// **'{count} Qonaq'**
  String numGuests(Object count);

  /// No description provided for @continueBtn.
  ///
  /// In az, this message translates to:
  /// **'Devam et'**
  String get continueBtn;

  /// No description provided for @userCanceledReason.
  ///
  /// In az, this message translates to:
  /// **'İstifadəçi rezervasiyanı ləğv etdi.'**
  String get userCanceledReason;

  /// No description provided for @discoveredTitle.
  ///
  /// In az, this message translates to:
  /// **'Kəşf Edilənlər'**
  String get discoveredTitle;

  /// No description provided for @discoveredSubtitle.
  ///
  /// In az, this message translates to:
  /// **'Sizin kəşf etdiyiniz və rezervasiya etdiyiniz unikal məkanlar.'**
  String get discoveredSubtitle;

  /// No description provided for @noDiscoveredYet.
  ///
  /// In az, this message translates to:
  /// **'Hələ heç bir məkan kəşf etməmisiniz'**
  String get noDiscoveredYet;

  /// No description provided for @noDiscoveredDescription.
  ///
  /// In az, this message translates to:
  /// **'Rezervasiya edib kəşf etdiyiniz məkanlar burada görünəcək.'**
  String get noDiscoveredDescription;

  /// No description provided for @supportScreenTitle.
  ///
  /// In az, this message translates to:
  /// **'Dəstək və Kömək'**
  String get supportScreenTitle;

  /// No description provided for @contactUs.
  ///
  /// In az, this message translates to:
  /// **'Bizimlə Əlaqə'**
  String get contactUs;

  /// No description provided for @whatsappSupport.
  ///
  /// In az, this message translates to:
  /// **'WhatsApp Dəstək'**
  String get whatsappSupport;

  /// No description provided for @emailSupport.
  ///
  /// In az, this message translates to:
  /// **'E-poçt Dəstək'**
  String get emailSupport;

  /// No description provided for @faq.
  ///
  /// In az, this message translates to:
  /// **'Tez-tez Verilən Suallar'**
  String get faq;

  /// No description provided for @privacyPolicyTitle.
  ///
  /// In az, this message translates to:
  /// **'Məxfilik Siyasəti'**
  String get privacyPolicyTitle;

  /// No description provided for @privacyPolicyContent.
  ///
  /// In az, this message translates to:
  /// **'Oyna platformasına xoş gəlmisiniz. Bu Məxfilik Siyasəti Oyna mobil tətbiqindən istifadə edərkən məlumatlarınızın necə toplandığını, istifadə olunduğunu və paylaşıldığını izah edir.\n\n1. Topladığımız Məlumatlar\nBiz, tətbiqdə qeydiyyatdan keçərkən təqdim etdiyiniz ad, e-poçt ünvanı, profil şəkli və rezervasiya məlumatlarını toplayırıq.\n\n2. Məlumatların İstifadəsi\nToplanan məlumatlar rezervasiya proseslərinin idarə edilməsi, məkan sahibləri ilə əlaqə yaradılması və istifadəçi təcrübəsinin yaxşılaşdırılması üçün istifadə olunur.\n\n3. Məlumatların Paylaşılması\nMəlumatlarınız müvafiq dərəcədə yalnız rezervasiya etdiyiniz məkan sahibləri ilə paylaşılır. Digər heç bir üçüncü tərəfə reklam qəsdi ilə satılmır.\n\n4. Məlumatların Qorunması\nMüştərilərin məlumatlarının təhlükəsizliyi bizim üçün prioritetdir. Şifrələmə və müasir təhlükəsizlik protokolları ilə məlumatlarınız qorunur.\n\n5. Uşaqların Məxfiliyi\nBiz 13 yaşdan aşağı uşaqlardan qəsdən məlumat toplamırıq.\n\n6. Hesabın Silinməsi\nSiz istənilən vaxt profilinizdən \'Hesabı sil\' bölməsindən istifadə edərək bütün məlumatlarınızı sistemdən silə bilərsiniz.\n\nBizimlə əlaqə üçün support@oyna.app ünvanına yaza bilərsiniz.'**
  String get privacyPolicyContent;

  /// No description provided for @logoutConfirmTitle.
  ///
  /// In az, this message translates to:
  /// **'Hesabdan çıxış'**
  String get logoutConfirmTitle;

  /// No description provided for @logoutConfirmMessage.
  ///
  /// In az, this message translates to:
  /// **'Hesabınızdan çıxış etmək istədiyinizə əminsiniz?'**
  String get logoutConfirmMessage;

  /// No description provided for @yesLogout.
  ///
  /// In az, this message translates to:
  /// **'Bəli, çıx'**
  String get yesLogout;

  /// No description provided for @invalidEmailAddress.
  ///
  /// In az, this message translates to:
  /// **'Düzgün e-poçt ünvanı daxil edin.'**
  String get invalidEmailAddress;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['az', 'en', 'ru'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'az':
      return AppLocalizationsAz();
    case 'en':
      return AppLocalizationsEn();
    case 'ru':
      return AppLocalizationsRu();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
