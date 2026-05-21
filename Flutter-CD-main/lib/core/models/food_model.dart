import '../utils/parse_helpers.dart';

class Food {
  final String id;
  final String adminId;
  final String name;
  final String category;
  final double price;
  final String description;
  final String image;

  Food({
    required this.id,
    required this.adminId,
    required this.name,
    required this.category,
    required this.price,
    this.description = '',
    this.image = '',
  });

  factory Food.fromJson(Map<String, dynamic> json) {
    return Food(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      adminId: parseObjectId(json['adminId']) ?? '',
      name: json['name'] as String? ?? 'Adsız',
      category: json['category'] as String? ?? 'Kateqoriya yoxdur',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      description: json['description'] as String? ?? '',
      image: json['image'] as String? ?? '',
    );
  }
}

