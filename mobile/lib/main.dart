import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/queue_provider.dart';
import 'screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => QueueProvider()),
      ],
      child: const VetTriageApp(),
    ),
  );
}

class VetTriageApp extends StatelessWidget {
  const VetTriageApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VetTriage',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF22c55e),
          brightness: Brightness.light,
        ),
      ),
      home: const SplashScreen(),
    );
  }
}
