import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/visit.dart';
import '../models/clinic_settings.dart';

class ApiService {
  static Future<Map<String, dynamic>> mobileLogin(
      String clinicCode, String clinicPin) async {
    final response = await http
        .post(
          Uri.parse('$apiBaseUrl/api/auth/mobile-login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'clinicCode': clinicCode, 'clinicPin': clinicPin}),
        )
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    if (response.statusCode == 401) throw Exception('Nieprawidłowy kod lub PIN');
    throw Exception('Błąd serwera: ${response.statusCode}');
  }

  static Future<List<Visit>> getPublicQueue(String clinicCode) async {
    final response = await http
        .get(Uri.parse('$apiBaseUrl/api/public/queue/$clinicCode'))
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final List<dynamic> data =
          jsonDecode(response.body) as List<dynamic>;
      return data
          .map((e) => Visit.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    throw Exception('Nie można pobrać kolejki: ${response.statusCode}');
  }

  static Future<ClinicSettings> getPublicClinicSettings(
      String clinicCode) async {
    final response = await http
        .get(Uri.parse(
            '$apiBaseUrl/api/public/clinic/$clinicCode/settings'))
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return ClinicSettings.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
    }
    throw Exception('Nie można pobrać ustawień kliniki');
  }

  static Future<void> registerDevice(
      String fcmToken, String clinicCode, String deviceName) async {
    try {
      await http
          .post(
            Uri.parse('$apiBaseUrl/api/devices/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'fcmToken': fcmToken,
              'clinicCode': clinicCode,
              'deviceName': deviceName,
            }),
          )
          .timeout(const Duration(seconds: 10));
    } catch (_) {
      // Rejestracja urządzenia nie jest krytyczna — ignoruj błędy
    }
  }
}
