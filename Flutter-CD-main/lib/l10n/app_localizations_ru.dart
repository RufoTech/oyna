// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Russian (`ru`).
class AppLocalizationsRu extends AppLocalizations {
  AppLocalizationsRu([String locale = 'ru']) : super(locale);

  @override
  String get home => 'Главная';

  @override
  String get search => 'Поиск';

  @override
  String get profile => 'Профиль';

  @override
  String get settings => 'Настройки';

  @override
  String get language => 'Язык';

  @override
  String get logout => 'Выйти';

  @override
  String get login => 'Войти';

  @override
  String get email => 'Эл. почта';

  @override
  String get password => 'Пароль';

  @override
  String get all => 'Все';

  @override
  String get venues => 'Места';

  @override
  String get favorites => 'Избранное';

  @override
  String get navMap => 'Карта';

  @override
  String get navSearch => 'Поиск';

  @override
  String get navFavorites => 'Избранное';

  @override
  String get navProfile => 'Профиль';

  @override
  String get searchBarHint => 'Найти лаунжи, караоке или интернет клубы...';

  @override
  String get filterPlayStation => 'PlayStation';

  @override
  String get filterInternetClub => 'Интернет Клуб';

  @override
  String get filterOpenNow => 'Открыто сейчас';

  @override
  String get searchTitle => 'Поиск';

  @override
  String get searchVenuesHint => 'Поиск заведений...';

  @override
  String nearbyResults(int count) {
    return 'ПОБЛИЗОСТИ $count РЕЗУЛЬТАТОВ';
  }

  @override
  String get sortAll => 'СОРТИРОВКА: ВСЕ';

  @override
  String get sortAlphabeticalAZ => 'А-Я (По алфавиту)';

  @override
  String get sortAlphabeticalZA => 'Я-А (В обратном порядке)';

  @override
  String get sortClosest => 'Ближайшие места';

  @override
  String get sortNewest => 'Новинки';

  @override
  String get sortTitle => 'Сортировка и фильтры';

  @override
  String get noVenueFound => 'Заведения не найдены';

  @override
  String get favoritesTitle => 'Ваше избранное';

  @override
  String get favoritesSubtitle => 'Особенные для вас места, все в одном месте.';

  @override
  String get searchInFavoritesHint => 'Поиск в избранном...';

  @override
  String get noFavoritesYet => 'Пока нет избранных';

  @override
  String get noFavoritesDescription =>
      'Нажмите на значок сердца у понравившихся\nзаведений, чтобы добавить их сюда.';

  @override
  String get reservations => 'Бронирования';

  @override
  String get myReservations => 'Мои бронирования';

  @override
  String get preferences => 'Предпочтения';

  @override
  String get notificationSettings => 'Настройки уведомлений';

  @override
  String get appLanguage => 'Язык приложения';

  @override
  String get support => 'Поддержка';

  @override
  String get editProfile => 'Редактировать профиль';

  @override
  String get deleteAccount => 'Удалить аккаунт';

  @override
  String get deleteAccountConfirm => 'Вы хотите удалить свой аккаунт?';

  @override
  String get deleteAccountWarning =>
      'Это действие нельзя отменить. Все ваши данные, сохранённые места и настройки будут удалены навсегда.';

  @override
  String get cancel => 'Отмена';

  @override
  String get savedVenues => 'СОХРАНЁННЫЕ МЕСТА';

  @override
  String get discovered => 'ОТКРЫТО';

  @override
  String get versionInfo => 'ВЕРСИЯ 2.4.1 (СБОРКА 890)';

  @override
  String get openNow => 'Открыто сейчас';

  @override
  String get venueClosed => 'Заведение закрыто';

  @override
  String get venue => 'Заведение';

  @override
  String get gameRoom => 'Игровой зал';

  @override
  String get errorOccurred => 'Произошла ошибка';

  @override
  String get azerbaijaniLanguage => 'Azərbaycan dili';

  @override
  String get englishLanguage => 'English';

  @override
  String get russianLanguage => 'Русский';

  @override
  String get selectLanguage => 'Выберите язык';

  @override
  String get temporarilyClosed => 'Временно закрыто';

  @override
  String get perHour => '/час';

  @override
  String get startingPrice => 'НАЧАЛЬНАЯ ЦЕНА';

  @override
  String get details => 'Подробнее';

  @override
  String get nowOpen => 'СЕЙЧАС ОТКРЫТО';

  @override
  String get closedCaps => 'ЗАКРЫТО';

  @override
  String get venueCurrentlyClosed => 'Место в данный момент закрыто';

  @override
  String get venueFull => 'Место заполнено';

  @override
  String get bookNow => 'Забронировать';

  @override
  String get venueNamePlaceholder => 'Название заведения';

  @override
  String get bakuAzerbaijan => 'Баку, Азербайджан';

  @override
  String get alwaysOpen => 'Всегда открыто';

  @override
  String get viewWorkingHours => 'Часы работы доступны';

  @override
  String get call => 'Позвонить';

  @override
  String get address => 'Адрес';

  @override
  String get priceTitle => 'Цена';

  @override
  String get menu => 'Меню';

  @override
  String get about => 'О заведении';

  @override
  String get noDescription => 'Информация о заведении отсутствует.';

  @override
  String get workingHours => 'Часы работы';

  @override
  String get alwaysOpen24_7 => '24/7 - Всегда открыто';

  @override
  String get note => 'Примечание';

  @override
  String get allDay => '24 ЧАСА';

  @override
  String get services => 'Услуги';

  @override
  String get allFeatures => 'Все возможности, предлагаемые заведением';

  @override
  String get gallery => 'Галерея';

  @override
  String get imagesFromVenue => 'Фотографии заведения';

  @override
  String get map => 'Карта';

  @override
  String get openInMap => 'Открыть на карте';

  @override
  String get mapDescription =>
      'Нажав на эту кнопку, вы сможете увидеть место на карте и проложить маршрут.';

  @override
  String get monday => 'Понедельник';

  @override
  String get tuesday => 'Вторник';

  @override
  String get wednesday => 'Среда';

  @override
  String get thursday => 'Четверг';

  @override
  String get friday => 'Пятница';

  @override
  String get saturday => 'Суббота';

  @override
  String get sunday => 'Воскресенье';

  @override
  String get closedSchedule => 'Закрыто';

  @override
  String get availableAmenity => 'В наличии';

  @override
  String get venueGallery => 'Галерея заведения';

  @override
  String get viewAll => 'Смотреть все';

  @override
  String get allPhotos => 'Все фото';

  @override
  String get venueTemporarilyClosedMsg => 'Место временно закрыто';

  @override
  String get venueFullMsg => 'Место заполнено';

  @override
  String get venueClosedByClockMsg => 'Место закрыто';

  @override
  String get venueClosedDescription =>
      'Заведение закрыто, так как время вышло. Бронирование не принимается.';

  @override
  String get venueOwnerStoppedReservations =>
      'К сожалению, владелец заведения временно приостановил бронирование. Пожалуйста, попробуйте позже.';

  @override
  String get goBack => 'Назад';

  @override
  String get pleaseFillAllFields => 'Пожалуйста, заполните все поля';

  @override
  String get cannotBookPastTime => 'Нельзя бронировать на прошедшее время';

  @override
  String get user => 'Пользователь';

  @override
  String get errorOccurredTryAgain =>
      'Произошла ошибка. Пожалуйста, попробуйте еще раз.';

  @override
  String get activeReservationSameVenue =>
      'У вас уже есть активная бронь в этом заведении. Пожалуйста, сначала отмените существующую бронь.';

  @override
  String get activeReservationOtherVenue =>
      'У вас уже есть активная бронь в другом заведении. Пожалуйста, сначала отмените существующую бронь.';

  @override
  String get attention => 'Внимание!';

  @override
  String get iUnderstand => 'Понятно';

  @override
  String get blockedByVenue => 'Вы заблокированы этим заведением!';

  @override
  String get blockedByVenueDesc =>
      'К сожалению, это заведение ограничило вам возможность бронирования. Вы можете связаться с заведением для получения дополнительной информации.';

  @override
  String get reserveSpot => 'Забронировать';

  @override
  String get dateTitle => 'Дата';

  @override
  String get today => 'Сегодня';

  @override
  String get mobileNumber => 'Мобильный номер';

  @override
  String get fieldRequired => '* Это поле обязательно';

  @override
  String get timeTitle => 'Время';

  @override
  String get additionalNote => 'Дополнительное примечание';

  @override
  String get noteHint =>
      'Введите ваши дополнительные пожелания по бронированию здесь...';

  @override
  String get tierSelection => 'Выбор Тира';

  @override
  String get standardSetup => 'Standard Setup';

  @override
  String get tierNotSelected => 'Тир не выбран';

  @override
  String get total => 'Итого';

  @override
  String get confirmReservation => 'Подтвердить бронирование';

  @override
  String get reservationSuccess => 'Бронирование успешно отправлено!';

  @override
  String get reservationSuccessMsg =>
      'Ваше бронирование принято. С вами свяжутся для подтверждения.';

  @override
  String get reservationSent => 'Бронирование успешно\nотправлено!';

  @override
  String get checkReservationsUnderProfile =>
      'Перейдите в раздел «Мои бронирования» в Профиле, чтобы проверить статус бронирования.';

  @override
  String get statusPending => 'Статус: Ожидание';

  @override
  String get provideDetailsAtVenue =>
      'При входе в заведение предъявите номер телефона или номер брони';

  @override
  String get january => 'Январь';

  @override
  String get february => 'Февраль';

  @override
  String get march => 'Март';

  @override
  String get april => 'Апрель';

  @override
  String get may => 'Май';

  @override
  String get june => 'Июнь';

  @override
  String get july => 'Июль';

  @override
  String get august => 'Август';

  @override
  String get september => 'Сентябрь';

  @override
  String get october => 'Октябрь';

  @override
  String get november => 'Ноябрь';

  @override
  String get december => 'Декабрь';

  @override
  String get menuNotAvailable => 'Меню недоступно';

  @override
  String get emptyMenu => 'Меню этого заведения пусто.';

  @override
  String itemsAvailable(Object count) {
    return '$count видов доступно';
  }

  @override
  String get noProductsInCategory => 'В этой категории товаров не найдено.';

  @override
  String get ratesNotAvailable => 'Цены недоступны';

  @override
  String get standardRates => 'Стандартные цены';

  @override
  String get pricingInfo => 'Информация о ценах';

  @override
  String perUnit(Object unit) {
    return '/ $unit';
  }

  @override
  String get ratesAndPackages => 'Цены и пакеты';

  @override
  String get gamingRates => 'Цены на игры';

  @override
  String get hourlyCaps => 'ПОЧАСОВО';

  @override
  String get unnamedTier => 'Без названия';

  @override
  String get specialPackages => 'Специальные пакеты';

  @override
  String discountedWithPercent(Object percent) {
    return 'СО СКИДКОЙ - $percent%';
  }

  @override
  String get discounted => 'СО СКИДКОЙ';

  @override
  String get userNotFound => 'Информация о пользователе не найдена';

  @override
  String get accepted => 'Принята';

  @override
  String get rejected => 'Отклонена';

  @override
  String get canceled => 'Отменена';

  @override
  String get pending => 'Ожидание';

  @override
  String get retry => 'Повторить';

  @override
  String get noReservationsYet => 'У вас пока нет бронирований';

  @override
  String get canBookFromVenuePage =>
      'Вы можете забронировать место на странице заведения';

  @override
  String get cancelReservationConfirmTitle => 'Отменить бронирование';

  @override
  String get cancelReservationConfirmMessage =>
      'Вы уверены, что хотите отменить бронирование?';

  @override
  String get no => 'Нет';

  @override
  String get yesCancel => 'Да, отменить';

  @override
  String reservationCode(Object code) {
    return 'Код бронирования: #$code';
  }

  @override
  String peopleCount(Object count) {
    return '$count чел.';
  }

  @override
  String get cancelReservationBtn => 'Отменить бронирование';

  @override
  String get editProfileTitle => 'Редактировать профиль';

  @override
  String get save => 'Сохранить';

  @override
  String get editProfileNotice =>
      'Обновление информации профиля может повлиять на ваш статус верификации. Убедитесь, что вся информация верна.';

  @override
  String get changePhoto => 'Изменить фото';

  @override
  String get personalInfoGroup => 'ЛИЧНАЯ ИНФОРМАЦИЯ';

  @override
  String get nameLabel => 'Имя';

  @override
  String get yourIdentity => 'Ваша личность';

  @override
  String get identityDescription =>
      'Другие пользователи и заведения будут видеть вас так на платформе.';

  @override
  String get fullNameLabel => 'ПОЛНОЕ ИМЯ';

  @override
  String get enterNameHint => 'Введите ваше имя';

  @override
  String get identityNotice =>
      'Использование настоящего имени помогает строить доверие в сообществе. Вы можете менять его раз в 30 дней.';

  @override
  String get previewLabel => 'ПРЕДПРОСМОТР';

  @override
  String memberSince(Object date) {
    return 'УЧАСТНИК С $date';
  }

  @override
  String get updatePhoneTitle => 'Обновите номер телефона';

  @override
  String get updatePhoneDescription =>
      'Мы отправим код подтверждения на этот номер, чтобы обеспечить безопасность вашего аккаунта. Могут применяться тарифы на сообщения.';

  @override
  String get phoneNumberLabel => 'МОБИЛЬНЫЙ НОМЕР';

  @override
  String get phoneHint => '(555) 000-0000';

  @override
  String get twoFactorAuth => 'Двухфакторная аутентификация';

  @override
  String get twoFactorDescription =>
      'Этот номер будет использоваться для двухфакторной аутентификации, чтобы ваша информация оставалась частной и защищенной.';

  @override
  String get confirmNumberBtn => 'Подтвердить номер';

  @override
  String get changedMind => 'Передумали? ';

  @override
  String get secureCloud => 'БЕЗОПАСНОЕ ОБЛАКО';

  @override
  String get encrypted => 'ЗАШИФРОВАНО';

  @override
  String get updateEmailTitle => 'Обновить E-mail';

  @override
  String get updateEmailDescription =>
      'Введите новый адрес электронной почты ниже. Мы отправим ссылку для подтверждения безопасности вашего аккаунта.';

  @override
  String get currentEmailLabel => 'ТЕКУЩИЙ E-MAIL';

  @override
  String get enterEmailHint => 'Введите новый e-mail';

  @override
  String get verificationProcess => 'Процесс верификации';

  @override
  String get verificationProcessDescription =>
      'После сохранения на ваш новый адрес будет отправлена ссылка для подтверждения. Ваш e-mail обновится только после того, как вы подтвердите изменение.';

  @override
  String get securityCheckStarted => 'Проверка безопасности начата';

  @override
  String get linkValid24Hours => 'Ссылка действительна 24 часа';

  @override
  String get privacyObjective => 'КОНФИДЕНЦИАЛЬНОСТЬ - ГЛАВНАЯ ЦЕЛЬ';

  @override
  String get dataEncrypted => 'Ваши данные зашифрованы сквозным шифрованием.';

  @override
  String get loginErrorEmpty => 'Введите адрес электронной почты и пароль.';

  @override
  String get loginErrorInvalid =>
      'Неверный адрес электронной почты или пароль.';

  @override
  String get loginErrorNetwork => 'Ошибка сети. Попробуйте еще раз.';

  @override
  String get loginSubtitle => 'Войдите в свой мир кураторства';

  @override
  String get emailAddressLabel => 'АДРЕС ЭЛЕКТРОННОЙ ПОЧТЫ';

  @override
  String get emailHint => 'name@example.com';

  @override
  String get passwordLabel => 'ПАРОЛЬ';

  @override
  String get forgotPasswordBtn => 'ЗАБЫЛИ ПАРОЛЬ?';

  @override
  String get signInBtn => 'Войти';

  @override
  String get orContinueWith => 'ИЛИ ПРОДОЛЖИТЕ С';

  @override
  String get donthaveAccount => 'Нет аккаунта?';

  @override
  String get signUpBtn => 'Зарегистрироваться';

  @override
  String get registerErrorEmpty => 'Заполните все поля.';

  @override
  String get registerErrorPasswordShort =>
      'Пароль должен содержать не менее 6 символов.';

  @override
  String get registerErrorPasswordsDontMatch => 'Пароли не совпадают.';

  @override
  String get registerErrorGeneral => 'Произошла ошибка.';

  @override
  String get registerSubtitle =>
      'Создайте аккаунт, чтобы начать свое кураторское путешествие.';

  @override
  String get fullNameLabelCaps => 'Полное имя';

  @override
  String get emailLabel => 'Email';

  @override
  String get passwordHintLength => 'Минимум 8 символов';

  @override
  String get confirmPasswordLabel => 'Подтвердите пароль';

  @override
  String get repeatPasswordHint => 'Повторите пароль';

  @override
  String get createAccountBtn => 'Создать аккаунт';

  @override
  String get or => 'или';

  @override
  String get continueWithGoogle => 'Продолжить с Google';

  @override
  String get alreadyHaveAccount => 'Уже есть аккаунт?';

  @override
  String get logInBtn => 'Войти';

  @override
  String get privacyPolicy => 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ';

  @override
  String get termsOfService => 'УСЛОВИЯ ИСПОЛЬЗОВАНИЯ';

  @override
  String get forgotPasswordHero => 'Забыли пароль?';

  @override
  String get forgotPasswordSubtitle =>
      'Введите свой адрес электронной почты, и мы отправим вам код для сброса пароля.';

  @override
  String get emailHintForgot => 'hello@example.com';

  @override
  String get sendResetCodeBtn => 'Отправить код сброса';

  @override
  String get backToLogin => 'Назад к входу';

  @override
  String get enterEmailError => 'Введите адрес электронной почты.';

  @override
  String get resetPasswordErrorLength =>
      'Код сброса должен состоять из 6 цифр.';

  @override
  String get passwordSuccess => 'Ваш пароль был успешно обновлен!';

  @override
  String get resetPasswordTitleAppbar => 'Сброс пароля';

  @override
  String get setNewPasswordHeader => 'Установите новый пароль';

  @override
  String resetCodeSentText(Object email) {
    return 'Код сброса был отправлен на $email.';
  }

  @override
  String get resetCodeLabel => 'КОД СБРОСА';

  @override
  String get newPasswordLabel => 'НОВЫЙ ПАРОЛЬ';

  @override
  String get passwordHintMinLength => 'Минимум 6 символов';

  @override
  String get confirmPasswordLabelCaps => 'ПОДТВЕРДИТЕ ПАРОЛЬ';

  @override
  String get updatePasswordBtn => 'Обновить пароль';

  @override
  String get verificationTitle => 'Верификация';

  @override
  String get checkEmailHero => 'Проверьте свою электронную почту';

  @override
  String otpSentText(Object email) {
    return '6-значный код подтверждения был отправлен на $email.';
  }

  @override
  String get verifyBtn => 'Подтвердить';

  @override
  String get didntReceiveCode => 'Не получили код? ';

  @override
  String resendIn(Object seconds) {
    return 'Отправить снова через $secondsс';
  }

  @override
  String get resendBtn => 'Отправить снова';

  @override
  String get skip => 'Пропустить';

  @override
  String get getStarted => 'Начать';

  @override
  String get next => 'Далее';

  @override
  String get onboardingStep1Title => 'Исследуйте окружение';

  @override
  String get onboardingStep1Subtitle =>
      'Найдите лучшие интернет-клубы, PlayStation-зоны и караоке-бары прямо на карте.';

  @override
  String get onboardingStep2Title => 'Сравните рейтинги';

  @override
  String get onboardingStep2Subtitle =>
      'Сравнивайте рейтинги, цены и доступные услуги, чтобы найти идеальное место для отдыха.';

  @override
  String get onboardingStep3Title => 'Бронируйте и идите';

  @override
  String get onboardingStep3Subtitle =>
      'Забронируйте место за считанные секунды и мгновенно проложите маршрут к месту назначения.';

  @override
  String get reserved => 'ЗАБРОНИРОВАНО';

  @override
  String get getDirections => 'Проложить маршрут';

  @override
  String get liveEventNearby => 'Живое событие рядом';

  @override
  String get trending => 'В ТРЕНДЕ';

  @override
  String get arrivalTimeLabel => 'Время прибытия';

  @override
  String get partySizeLabel => 'Количество гостей';

  @override
  String todayAt(Object time) {
    return 'Сегодня, $time';
  }

  @override
  String numGuests(Object count) {
    return 'Гостей: $count';
  }

  @override
  String get continueBtn => 'Продолжить';

  @override
  String get userCanceledReason => 'Пользователь отменил бронирование.';

  @override
  String get discoveredTitle => 'Открытые заведения';

  @override
  String get discoveredSubtitle =>
      'Уникальные заведения, которые вы открыли и забронировали.';

  @override
  String get noDiscoveredYet => 'Пока нет открытых заведений';

  @override
  String get noDiscoveredDescription =>
      'Здесь будут отображаться заведения, которые вы открываете, делая бронирования.';

  @override
  String get supportScreenTitle => 'Поддержка и Помощь';

  @override
  String get contactUs => 'Свяжитесь с нами';

  @override
  String get whatsappSupport => 'Поддержка WhatsApp';

  @override
  String get emailSupport => 'Поддержка по Email';

  @override
  String get faq => 'Часто задаваемые вопросы';

  @override
  String get privacyPolicyTitle => 'Политика конфиденциальности';

  @override
  String get privacyPolicyContent =>
      'Добро пожаловать в Oyna. Эта Политика конфиденциальности объясняет, как ваша информация собирается, используется и передается при использовании мобильного приложения Oyna.\n\n1. Собираемая информация\nМы собираем такую информацию, как ваше имя, адрес электронной почты, фотографию профиля и данные о бронированиях.\n\n2. Использование информации\nСобранные данные используются для управления бронированиями, связи с владельцами заведений и улучшения пользовательского опыта.\n\n3. Передача информации\nВаша информация передается только заведениям, в которых вы бронируете места. Мы не продаем ваши данные третьим лицам.\n\n4. Безопасность данных\nЗащита данных клиентов - наш приоритет. Ваши данные защищены шифрованием и современными протоколами безопасности.\n\n5. Конфиденциальность детей\nМы не собираем намеренно личную информацию от детей в возрасте до 13 лет.\n\n6. Удаление аккаунта\nВы можете навсегда удалить свой аккаунт и все связанные с ним данные в любое время с помощью функции \'Удалить аккаунт\' в вашем профиле.\n\nЕсли у вас есть вопросы, свяжитесь с нами по адресу support@oyna.app.';
}
