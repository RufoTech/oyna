/// Data model for a Reservation from the backend.
class Reservation {
  final String id;
  final String venueId;
  final String venueName;
  final String userId;
  final String userName;
  final String? userEmail;
  final String userPhone;
  final int peopleCount;
  final String date;
  final String time;
  final String? tierTitle;
  final double tierPrice;
  final String? description;
  final String status; // 'pending' | 'accepted' | 'rejected' | 'canceled'
  final String? rejectReason;
  final String? reservationNumber;
  final DateTime? createdAt;
  final DateTime? checkedInAt;
  final DateTime? graceDeadline;
  final String? tableId;
  final String? tableName;

  Reservation({
    required this.id,
    required this.venueId,
    required this.venueName,
    required this.userId,
    required this.userName,
    this.userEmail,
    required this.userPhone,
    required this.peopleCount,
    required this.date,
    required this.time,
    this.tierTitle,
    this.tierPrice = 0,
    this.description,
    this.status = 'pending',
    this.rejectReason,
    this.reservationNumber,
    this.createdAt,
    this.checkedInAt,
    this.graceDeadline,
    this.tableId,
    this.tableName,
  });

  factory Reservation.fromJson(Map<String, dynamic> json) {
    return Reservation(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      venueId: json['venueId'] as String? ?? '',
      venueName: json['venueName'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      userName: json['userName'] as String? ?? '',
      userEmail: json['userEmail'] as String?,
      userPhone: json['userPhone'] as String? ?? '',
      peopleCount: (json['peopleCount'] as num?)?.toInt() ?? 1,
      date: json['date'] as String? ?? '',
      time: json['time'] as String? ?? '',
      tierTitle: json['tierTitle'] as String?,
      tierPrice: (json['tierPrice'] as num?)?.toDouble() ?? 0,
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'pending',
      rejectReason: json['rejectReason'] as String?,
      reservationNumber: json['reservationNumber'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      checkedInAt: json['checkedInAt'] != null
          ? DateTime.tryParse(json['checkedInAt'] as String)
          : null,
      graceDeadline: json['graceDeadline'] != null
          ? DateTime.tryParse(json['graceDeadline'] as String)
          : null,
      tableId: json['tableId'] as String?,
      tableName: json['tableName'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'venueId': venueId,
      'venueName': venueName,
      'userId': userId,
      'userName': userName,
      'userEmail': userEmail,
      'userPhone': userPhone,
      'peopleCount': peopleCount,
      'date': date,
      'time': time,
      'tierTitle': tierTitle,
      'tierPrice': tierPrice,
      'description': description,
      'status': status,
      'rejectReason': rejectReason,
      'reservationNumber': reservationNumber,
      'checkedInAt': checkedInAt?.toIso8601String(),
      'graceDeadline': graceDeadline?.toIso8601String(),
      'tableId': tableId,
      'tableName': tableName,
    };
  }
}
