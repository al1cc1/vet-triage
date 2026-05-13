import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

// TODO: Add google-services.json to android/app/ to enable push notifications.
//       Without it the app works normally — Firebase init is caught and skipped.
//       Also add to android/app/build.gradle: apply plugin: 'com.google.gms.google-services'
//       And to android/build.gradle classpath: 'com.google.gms:google-services:4.4.1'

/// Background message handler — must be top-level.
@pragma('vm:entry-point')
Future<void> _onBackgroundMessage(RemoteMessage message) async {
  // System displays the notification automatically in background/terminated state.
}

final _localNotifications = FlutterLocalNotificationsPlugin();

class NotificationService {
  static const _channelId = 'vettriage_critical';
  static const _channelName = 'VetTriage – krytyczne';
  static const _channelDesc = 'Powiadomienia o krytycznych pacjentach';

  static Future<void> initialize(String clinicCode) async {
    await _initLocalNotifications();

    try {
      await Firebase.initializeApp();

      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      FirebaseMessaging.onBackgroundMessage(_onBackgroundMessage);

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        showLocalNotification(
          message.notification?.title ?? '🚨 VetTriage',
          message.notification?.body ?? '',
        );
      });

      final fcmToken = await FirebaseMessaging.instance.getToken();
      if (fcmToken != null && fcmToken.isNotEmpty) {
        final deviceName = Platform.isAndroid ? 'Android' : 'iOS';
        await ApiService.registerDevice(fcmToken, clinicCode, deviceName);
        debugPrint('VetTriage: FCM token registered');
      }
    } catch (e) {
      // Aplikacja działa bez Firebase — push notifications wyłączone
      debugPrint('VetTriage: Firebase unavailable — $e');
    }
  }

  static Future<void> _initLocalNotifications() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    await _localNotifications.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );
  }

  static Future<void> showLocalNotification(
      String title, String body) async {
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        _channelId,
        _channelName,
        channelDescription: _channelDesc,
        importance: Importance.max,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(
        presentAlert: true,
        presentSound: true,
      ),
    );
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(1000000),
      title,
      body,
      details,
    );
  }
}
