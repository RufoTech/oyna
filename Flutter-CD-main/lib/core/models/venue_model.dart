import '../utils/parse_helpers.dart';

/// Data model mirroring the NestJS/Mongoose Venue schema.
/// Used by Dio to deserialise JSON from the backend.
class Venue {
  final String id;
  final String adminId;
  final String status;
  final bool temporarilyClosed;
  final String? logo;
  final String? name;
  final String? category;
  final String? slogan;
  final String? description;
  final VenueLocation? location;
  final List<String> branches;
  final VenueMedia? media;
  final VenuePricing? pricing;
  final List<String> amenities;
  final VenueOperatingHours? operatingHours;
  final VenueContact? contact;
  final VenueBookingRules? bookingRules;
  final VenueSpecs? specs;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Venue({
    required this.id,
    required this.adminId,
    this.status = 'DRAFT',
    this.temporarilyClosed = false,
    this.logo,
    this.name,
    this.category,
    this.slogan,
    this.description,
    this.location,
    this.branches = const [],
    this.media,
    this.pricing,
    this.amenities = const [],
    this.operatingHours,
    this.contact,
    this.bookingRules,
    this.specs,
    this.createdAt,
    this.updatedAt,
  });

  factory Venue.fromJson(Map<String, dynamic> json) {
    return Venue(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      adminId: parseObjectId(json['adminId']) ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      temporarilyClosed: json['temporarilyClosed'] as bool? ?? false,
      logo: json['logo'] as String?,
      name: json['name'] as String?,
      category: json['category'] as String?,
      slogan: json['slogan'] as String?,
      description: json['description'] as String?,
      location: json['location'] != null
          ? VenueLocation.fromJson(json['location'] as Map<String, dynamic>)
          : null,
      branches: (json['branches'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      media: json['media'] != null
          ? VenueMedia.fromJson(json['media'] as Map<String, dynamic>)
          : null,
      pricing: json['pricing'] != null
          ? VenuePricing.fromJson(json['pricing'] as Map<String, dynamic>)
          : null,
      amenities: (json['amenities'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      operatingHours: json['operatingHours'] != null
          ? VenueOperatingHours.fromJson(
              json['operatingHours'] as Map<String, dynamic>)
          : null,
      contact: json['contact'] != null
          ? VenueContact.fromJson(json['contact'] as Map<String, dynamic>)
          : null,
      bookingRules: json['bookingRules'] != null
          ? VenueBookingRules.fromJson(
              json['bookingRules'] as Map<String, dynamic>)
          : null,
      specs: json['specs'] != null
          ? VenueSpecs.fromJson(json['specs'] as Map<String, dynamic>)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }

  bool get isOpenByClock {
    if (temporarilyClosed) return false;
    if (operatingHours == null) return true;
    if (operatingHours!.is24_7) return true;

    final now = DateTime.now();
    final weekdays = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday'
    ];
    final todayStr = weekdays[now.weekday - 1];
    final schedule = operatingHours!.schedule[todayStr];

    if (schedule == null || schedule.closed) return false;
    if (schedule.open == null || schedule.close == null) return true;

    try {
      final openParts = schedule.open!.split(':');
      final closeParts = schedule.close!.split(':');
      final openTime = int.parse(openParts[0]) * 60 + int.parse(openParts[1]);
      final closeTime = int.parse(closeParts[0]) * 60 + int.parse(closeParts[1]);

      // 00:00 - 00:00 means 24-hour open for that day (admin panel 7/24 format)
      if (openTime == 0 && closeTime == 0) return true;

      final nowTime = now.hour * 60 + now.minute;

      if (schedule.isNextDay || closeTime < openTime) {
        if (nowTime >= openTime || nowTime <= closeTime) return true;
      } else {
        if (nowTime >= openTime && nowTime <= closeTime) return true;
      }
      return false;
    } catch (_) {
      return true;
    }
  }

  /// Create a copy of this Venue with updated status fields (for real-time socket updates).
  Venue copyWithStatus({String? status, bool? temporarilyClosed}) {
    return Venue(
      id: id,
      adminId: adminId,
      status: status ?? this.status,
      temporarilyClosed: temporarilyClosed ?? this.temporarilyClosed,
      logo: logo,
      name: name,
      category: category,
      slogan: slogan,
      description: description,
      location: location,
      branches: branches,
      media: media,
      pricing: pricing,
      amenities: amenities,
      operatingHours: operatingHours,
      contact: contact,
      bookingRules: bookingRules,
      specs: specs,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

// ── Location ──
class VenueLocation {
  final String type;
  final List<double> coordinates; // [longitude, latitude]
  final String? city;
  final String? address;

  VenueLocation({
    this.type = 'Point',
    this.coordinates = const [0, 0],
    this.city,
    this.address,
  });

  double get longitude => coordinates.isNotEmpty ? coordinates[0] : 0;
  double get latitude => coordinates.length > 1 ? coordinates[1] : 0;

  factory VenueLocation.fromJson(Map<String, dynamic> json) {
    return VenueLocation(
      type: json['type'] as String? ?? 'Point',
      coordinates: (json['coordinates'] as List<dynamic>?)
              ?.map((e) => (e as num).toDouble())
              .toList() ??
          [0, 0],
      city: json['city'] as String?,
      address: json['address'] as String?,
    );
  }
}

// ── Media ──
class MediaGalleryItem {
  final String url;
  final bool isPrimary;
  final String type;

  MediaGalleryItem({
    required this.url,
    this.isPrimary = false,
    this.type = 'IMAGE',
  });

  factory MediaGalleryItem.fromJson(Map<String, dynamic> json) {
    return MediaGalleryItem(
      url: json['url'] as String? ?? '',
      isPrimary: json['isPrimary'] as bool? ?? false,
      type: json['type'] as String? ?? 'IMAGE',
    );
  }
}

class VenueMedia {
  final MediaGalleryItem? heroImage;
  final List<MediaGalleryItem> gallery;

  VenueMedia({this.heroImage, this.gallery = const []});

  /// Parses heroImage which can be:
  /// - A Map (MediaGalleryItem object)
  /// - A List<String> (array of URLs from admin panel)
  /// - A String (single URL)
  static MediaGalleryItem? _parseHeroImage(dynamic raw) {
    if (raw == null) return null;
    if (raw is Map<String, dynamic>) {
      return MediaGalleryItem.fromJson(raw);
    }
    if (raw is List && raw.isNotEmpty) {
      final first = raw[0];
      if (first is String) return MediaGalleryItem(url: first);
      if (first is Map<String, dynamic>) return MediaGalleryItem.fromJson(first);
    }
    if (raw is String) {
      return MediaGalleryItem(url: raw);
    }
    return null;
  }

  /// Parses gallery which can be:
  /// - A List<Map> (MediaGalleryItem objects)
  /// - A List<String> (array of URLs from admin panel)
  static List<MediaGalleryItem> _parseGallery(dynamic raw) {
    if (raw == null || raw is! List) return [];
    return raw.map((e) {
      if (e is Map<String, dynamic>) return MediaGalleryItem.fromJson(e);
      if (e is String) return MediaGalleryItem(url: e);
      return MediaGalleryItem(url: '');
    }).toList();
  }

  factory VenueMedia.fromJson(Map<String, dynamic> json) {
    return VenueMedia(
      heroImage: _parseHeroImage(json['heroImage']),
      gallery: _parseGallery(json['gallery']),
    );
  }
}

// ── Pricing ──
class VenuePricing {
  final double basePrice;
  final bool peakPricingEnabled;

  VenuePricing({this.basePrice = 0, this.peakPricingEnabled = false});

  factory VenuePricing.fromJson(Map<String, dynamic> json) {
    return VenuePricing(
      basePrice: (json['basePrice'] as num?)?.toDouble() ?? 0,
      peakPricingEnabled: json['peakPricingEnabled'] as bool? ?? false,
    );
  }
}

// ── Operating Hours ──
class ScheduleDay {
  final String? open;
  final String? close;
  final bool closed;
  final bool isNextDay;

  ScheduleDay({this.open, this.close, this.closed = false, this.isNextDay = false});

  factory ScheduleDay.fromJson(Map<String, dynamic> json) {
    return ScheduleDay(
      open: json['open'] as String?,
      close: json['close'] as String?,
      closed: json['closed'] as bool? ?? false,
      isNextDay: json['isNextDay'] as bool? ?? false,
    );
  }
}

class VenueOperatingHours {
  final bool is24_7;
  final Map<String, ScheduleDay> schedule;

  VenueOperatingHours({this.is24_7 = false, this.schedule = const {}});

  factory VenueOperatingHours.fromJson(Map<String, dynamic> json) {
    final scheduleMap = <String, ScheduleDay>{};
    if (json['schedule'] is Map) {
      (json['schedule'] as Map<String, dynamic>).forEach((key, value) {
        scheduleMap[key] =
            ScheduleDay.fromJson(value as Map<String, dynamic>);
      });
    }
    return VenueOperatingHours(
      is24_7: json['is24_7'] as bool? ?? false,
      schedule: scheduleMap,
    );
  }
}

// ── Contact ──
class VenueContact {
  final String? phone;
  final String? email;
  final String? instagram;
  final String? whatsapp;
  final String? website;

  VenueContact({this.phone, this.email, this.instagram, this.whatsapp, this.website});

  factory VenueContact.fromJson(Map<String, dynamic> json) {
    return VenueContact(
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      instagram: json['instagram'] as String?,
      whatsapp: json['whatsapp'] as String?,
      website: json['website'] as String?,
    );
  }
}

// ── Booking Rules ──
class VenueBookingRules {
  final String? minTime;
  final String? maxTime;
  final int gracePeriod;

  VenueBookingRules({
    this.minTime,
    this.maxTime,
    this.gracePeriod = 0,
  });

  factory VenueBookingRules.fromJson(Map<String, dynamic> json) {
    return VenueBookingRules(
      minTime: json['minTime'] as String? ?? json['minTimeMinutes']?.toString(),
      maxTime: json['maxTime'] as String? ?? json['maxTimeMinutes']?.toString(),
      gracePeriod: (json['gracePeriod'] as num?)?.toInt() ?? 0,
    );
  }
}

// ── Specs (Step 4 — Tiers & Packages) ──
class HardwareItem {
  final String? category;
  final String? name;
  final String? description;
  final String? icon;

  HardwareItem({this.category, this.name, this.description, this.icon});

  factory HardwareItem.fromJson(Map<String, dynamic> json) {
    return HardwareItem(
      category: json['category'] as String?,
      name: json['name'] as String?,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
    );
  }
}

class AccessoryItem {
  final String? category;
  final String? name;
  final String? description;
  final String? icon;

  AccessoryItem({this.category, this.name, this.description, this.icon});

  factory AccessoryItem.fromJson(Map<String, dynamic> json) {
    return AccessoryItem(
      category: json['category'] as String?,
      name: json['name'] as String?,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
    );
  }
}

class FeatureItem {
  final String? text;
  final String? icon;

  FeatureItem({this.text, this.icon});

  factory FeatureItem.fromJson(Map<String, dynamic> json) {
    return FeatureItem(
      text: json['text'] as String?,
      icon: json['icon'] as String?,
    );
  }
}

class Tier {
  final String? id;
  final String? type;
  final String? title;
  final double price;
  final String? shortSpec;
  final String? icon;
  final bool isActive;
  final String? heroImage;
  final List<HardwareItem> hardware;
  final List<AccessoryItem> accessories;
  final List<FeatureItem> features;

  Tier({
    this.id,
    this.type,
    this.title,
    this.price = 0,
    this.shortSpec,
    this.icon,
    this.isActive = true,
    this.heroImage,
    this.hardware = const [],
    this.accessories = const [],
    this.features = const [],
  });

  factory Tier.fromJson(Map<String, dynamic> json) {
    return Tier(
      id: json['_id'] as String? ?? json['id'] as String?,
      type: json['type'] as String?,
      title: json['title'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      shortSpec: json['shortSpec'] as String?,
      icon: json['icon'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      heroImage: json['heroImage'] as String?,
      hardware: (json['hardware'] as List<dynamic>?)
              ?.map((e) => HardwareItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      accessories: (json['accessories'] as List<dynamic>?)
              ?.map((e) => AccessoryItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      features: (json['features'] as List<dynamic>?)
              ?.map((e) => FeatureItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class SpecPackage {
  final String title;
  final String? description;
  final double price;
  final bool hasDiscount;
  final double? discountPrice;

  SpecPackage({
    required this.title,
    this.description,
    this.price = 0,
    this.hasDiscount = false,
    this.discountPrice,
  });

  factory SpecPackage.fromJson(Map<String, dynamic> json) {
    return SpecPackage(
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      hasDiscount: json['hasDiscount'] as bool? ?? false,
      discountPrice: (json['discountPrice'] as num?)?.toDouble(),
    );
  }
}

class VenueSpecs {
  final String? pageTitle;
  final String? pageSubtitle;
  final List<Tier> tiers;
  final List<SpecPackage> packages;

  VenueSpecs({
    this.pageTitle,
    this.pageSubtitle,
    this.tiers = const [],
    this.packages = const [],
  });

  factory VenueSpecs.fromJson(Map<String, dynamic> json) {
    return VenueSpecs(
      pageTitle: json['pageTitle'] as String?,
      pageSubtitle: json['pageSubtitle'] as String?,
      tiers: (json['tiers'] as List<dynamic>?)
              ?.map((e) => Tier.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      packages: (json['packages'] as List<dynamic>?)
              ?.map((e) => SpecPackage.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

