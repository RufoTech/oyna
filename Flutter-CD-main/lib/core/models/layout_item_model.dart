/// Data model for a simulation layout item (table/desk/room).
/// Maps to the admin panel's Simulation canvas items stored in venue.layout.items[].
class LayoutItem {
  final String id;
  final String type; // 'pc', 'playstation', 'room'
  final String? tierId;
  final String name;
  final double x;
  final double y;
  final double w;
  final double h;
  final String status; // 'available', 'reserved', 'occupied', 'disabled'
  final double price;
  final int capacity;
  final List<String> connectedTo;

  LayoutItem({
    required this.id,
    required this.type,
    this.tierId,
    required this.name,
    required this.x,
    required this.y,
    required this.w,
    required this.h,
    this.status = 'available',
    this.price = 0,
    this.capacity = 1,
    this.connectedTo = const [],
  });

  factory LayoutItem.fromJson(Map<String, dynamic> json) {
    return LayoutItem(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'pc',
      tierId: json['tierId'] as String?,
      name: json['name'] as String? ?? '',
      x: (json['x'] as num?)?.toDouble() ?? 0,
      y: (json['y'] as num?)?.toDouble() ?? 0,
      w: (json['w'] as num?)?.toDouble() ?? 140,
      h: (json['h'] as num?)?.toDouble() ?? 140,
      status: json['status'] as String? ?? 'available',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      capacity: (json['capacity'] as num?)?.toInt() ?? 1,
      connectedTo: (json['connectedTo'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  bool get isAvailable => status == 'available';
  bool get isReserved => status == 'reserved';
  bool get isOccupied => status == 'occupied';
  bool get isDisabled => status == 'disabled';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! LayoutItem) return false;

    return other.id == id &&
        other.type == type &&
        other.tierId == tierId &&
        other.name == name &&
        other.x == x &&
        other.y == y &&
        other.w == w &&
        other.h == h &&
        other.status == status &&
        other.price == price &&
        other.capacity == capacity &&
        _listEquals(other.connectedTo, connectedTo);
  }

  bool _listEquals(List<String> a, List<String> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  @override
  int get hashCode {
    return Object.hash(
      id,
      type,
      tierId,
      name,
      x,
      y,
      w,
      h,
      status,
      price,
      capacity,
      Object.hashAll(connectedTo),
    );
  }
}
