import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:stomp_dart_client/stomp.dart';
import 'package:stomp_dart_client/stomp_config.dart';
import 'package:stomp_dart_client/stomp_frame.dart';
import '../config.dart';
import '../models/visit.dart';

class WebSocketService {
  StompClient? _client;
  final String clinicCode;
  final void Function(List<Visit>) onQueueUpdate;

  WebSocketService({
    required this.clinicCode,
    required this.onQueueUpdate,
  });

  void connect() {
    _client = StompClient(
      config: StompConfig(
        url: wsUrl,
        onConnect: _onConnect,
        beforeConnect: () async {},
        onWebSocketError: (dynamic error) =>
            debugPrint('VetTriage WS error: $error'),
        onStompError: (StompFrame frame) =>
            debugPrint('VetTriage STOMP error: ${frame.body}'),
        onDisconnect: (StompFrame frame) =>
            debugPrint('VetTriage WS disconnected'),
        reconnectDelay: const Duration(seconds: 5),
        heartbeatIncoming: Duration.zero,
        heartbeatOutgoing: Duration.zero,
      ),
    );
    _client!.activate();
  }

  void _onConnect(StompFrame frame) {
    _client!.subscribe(
      destination: '/topic/queue/$clinicCode',
      callback: (StompFrame frame) {
        if (frame.body == null) return;
        try {
          final List<dynamic> data =
              jsonDecode(frame.body!) as List<dynamic>;
          final visits = data
              .map((e) => Visit.fromJson(e as Map<String, dynamic>))
              .toList();
          onQueueUpdate(visits);
        } catch (e) {
          debugPrint('VetTriage WS parse error: $e');
        }
      },
    );
  }

  void disconnect() {
    _client?.deactivate();
    _client = null;
  }
}
