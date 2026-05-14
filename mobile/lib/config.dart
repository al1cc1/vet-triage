import 'package:flutter/material.dart';

const bool kProduction = bool.fromEnvironment('PRODUCTION', defaultValue: false);

const String apiBaseUrl = kProduction
    ? 'https://vet-triage-backend-b3ft.onrender.com'
    : 'http://10.0.2.2:8081';

// Native (non-SockJS) WebSocket endpoint — see backend WebSocketConfig
const String wsUrl = kProduction
    ? 'wss://vet-triage-backend-b3ft.onrender.com/ws-native'
    : 'ws://10.0.2.2:8081/ws-native';

Color categoryColor(String category) {
  switch (category) {
    case 'RED':
      return const Color(0xFFef4444);
    case 'ORANGE':
      return const Color(0xFFf97316);
    case 'YELLOW':
      return const Color(0xFFeab308);
    case 'GREEN':
      return const Color(0xFF22c55e);
    default:
      return Colors.grey;
  }
}

Color categoryBg(String category) {
  switch (category) {
    case 'RED':
      return const Color(0xFFfef2f2);
    case 'ORANGE':
      return const Color(0xFFfff7ed);
    case 'YELLOW':
      return const Color(0xFFfefce8);
    case 'GREEN':
      return const Color(0xFFf0fdf4);
    default:
      return Colors.white;
  }
}

Color hexColor(String hex) {
  final code = hex.replaceAll('#', '');
  return Color(int.parse('FF$code', radix: 16));
}
