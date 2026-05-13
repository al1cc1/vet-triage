# VetTriage Mobile — Setup

## 1. Utwórz projekt Flutter (wymagany Flutter SDK)

```bash
cd C:\Users\alicc\vet-triage
flutter create mobile --org com.vettriage --project-name vet_triage_mobile
```

Pliki `lib/` i `pubspec.yaml` z tego repozytorium nadpiszą wygenerowane pliki.

## 2. Zainstaluj zależności

```bash
cd mobile
flutter pub get
```

## 3. Firebase / google-services.json

Plik `google-services.json` jest w `C:\Users\alicc\vet-triage\google-services.json`.
Skopiuj go do:

```
mobile/android/app/google-services.json
```

Następnie w `android/app/build.gradle` dodaj na końcu:

```groovy
apply plugin: 'com.google.gms.google-services'
```

W `android/build.gradle` w sekcji `dependencies` (classpath) dodaj:

```groovy
classpath 'com.google.gms:google-services:4.4.1'
```

W `android/app/src/main/AndroidManifest.xml` dodaj uprawnienia:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

## 4. Uruchomienie (emulator Android)

```bash
flutter run
# lub z własnym hostem API:
flutter run --dart-define=API_HOST=192.168.1.100
```

## 5. Wersja Dart / stomp_dart_client

`pubspec.yaml` używa `stomp_dart_client: ^0.4.4` (Dart < 3.0).
Jeśli masz Flutter 3.10+ (Dart 3.x), zmień:

```yaml
environment:
  sdk: '>=3.0.0 <4.0.0'
dependencies:
  stomp_dart_client: ^2.0.0
```

I w `lib/services/websocket_service.dart` zmień sygnaturę callback `onConnect`:

```dart
// Stara (0.4.x):
void _onConnect(StompClient client, StompFrame frame) { ... }
// Nowa (2.x):
void _onConnect(StompFrame frame) { _client!.subscribe(...); }
```

## 6. Backend — wymagane zmiany

Backend uruchomi się bez Firebase (brak `firebase-service-account.json` to tylko warning).
Aby włączyć push notyfikacje RED:

1. Pobierz service account JSON z Firebase Console → Project Settings → Service accounts
2. Zapisz jako `backend/firebase-service-account.json`
3. Lub ustaw zmienną środowiskową: `FIREBASE_SERVICE_ACCOUNT_PATH=/ścieżka/do/pliku.json`
