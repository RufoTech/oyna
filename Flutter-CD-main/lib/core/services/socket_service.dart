import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../constants/app_config.dart';
import 'notification_service.dart';

/// Singleton service that manages the Socket.io connection to the backend.
/// Provides streams for real-time reservation status updates and venue status changes.
class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool _isConnected = false;

  final _statusUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();

  final _venueUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();

  final _layoutUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();

  /// Stream of reservation status updates (for the user).
  Stream<Map<String, dynamic>> get onStatusUpdate =>
      _statusUpdateController.stream;

  /// Stream of venue status changes (temporarilyClosed, status toggle, hours).
  Stream<Map<String, dynamic>> get onVenueUpdate =>
      _venueUpdateController.stream;

  /// Stream of venue layout updates (table status changes).
  Stream<Map<String, dynamic>> get onLayoutUpdate =>
      _layoutUpdateController.stream;

  /// Connect to the Socket.io server with user info and JWT token.
  void connect({required String userId, required String token}) {
    if (_isConnected) return;

    _socket = IO.io(
      AppConfig.baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .setQuery({'role': 'user', 'userId': userId})
          .disableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('SocketService: Connected as user $userId');
    });

    _socket!.on('reservationStatusUpdate', (data) {
      debugPrint('SocketService: Status update received: $data');
      if (data is Map<String, dynamic>) {
        _statusUpdateController.add(data);
        
        // Trigger instant local push notification
        final status = data['status'];
        final venueName = data['venueName'] ?? 'Məkan';
        
        if (status == 'accepted') {
          NotificationService().showNotification(
            id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
            title: '✅ Rezervasiya Təsdiqləndi!',
            body: '$venueName sizin müraciətinizi qəbul etdi.',
          );
        } else if (status == 'rejected') {
          final reason = data['rejectReason'] != null && data['rejectReason'].toString().isNotEmpty
              ? '\nSəbəb: ${data['rejectReason']}'
              : '';
          NotificationService().showNotification(
            id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
            title: '❌ Rezervasiya İmtina Edildi',
            body: '$venueName müraciətinizi rədd etdi.$reason',
          );
        }
      }
    });

    _socket!.on('venueStatusUpdate', (data) {
      debugPrint('SocketService: Venue status update received: $data');
      if (data is Map<String, dynamic>) {
        _venueUpdateController.add(data);
      }
    });

    _socket!.on('venueLayoutUpdate', (data) {
      debugPrint('SocketService: Venue layout update received: $data');
      if (data is Map<String, dynamic>) {
        _layoutUpdateController.add(data);
      }
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      debugPrint('SocketService: Disconnected');
    });

    _socket!.onConnectError((error) {
      debugPrint('SocketService: Connection error: $error');
    });

    _socket!.connect();
  }

  /// Disconnect from the Socket.io server.
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }

  /// Dispose the service (call on app shutdown).
  void dispose() {
    disconnect();
    _statusUpdateController.close();
    _venueUpdateController.close();
    _layoutUpdateController.close();
  }
}
