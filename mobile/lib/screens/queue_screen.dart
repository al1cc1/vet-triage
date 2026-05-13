import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';
import '../models/clinic_settings.dart';
import '../providers/queue_provider.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';
import '../services/notification_service.dart';
import '../widgets/visit_card.dart';
import 'login_screen.dart';

class QueueScreen extends StatefulWidget {
  final String clinicCode;

  const QueueScreen({super.key, required this.clinicCode});

  @override
  State<QueueScreen> createState() => _QueueScreenState();
}

class _QueueScreenState extends State<QueueScreen> {
  WebSocketService? _wsService;
  ClinicSettings? _settings;
  bool _wsConnected = false;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    await Future.wait([
      _loadSettings(),
      _loadQueue(),
    ]);
    _connectWebSocket();
    NotificationService.initialize(widget.clinicCode);
  }

  Future<void> _loadSettings() async {
    try {
      final s = await ApiService.getPublicClinicSettings(widget.clinicCode);
      if (mounted) setState(() => _settings = s);
    } catch (_) {}
  }

  Future<void> _loadQueue() async {
    final provider = context.read<QueueProvider>();
    provider.setLoading(true);
    try {
      final visits = await ApiService.getPublicQueue(widget.clinicCode);
      if (mounted) provider.setVisits(visits);
    } catch (e) {
      if (mounted) provider.setError('Nie można pobrać kolejki');
    }
  }

  void _connectWebSocket() {
    _wsService?.disconnect();
    _wsService = WebSocketService(
      clinicCode: widget.clinicCode,
      onQueueUpdate: (visits) {
        if (mounted) {
          context.read<QueueProvider>().setVisits(visits);
          if (!_wsConnected) setState(() => _wsConnected = true);
        }
      },
    );
    _wsService!.connect();
    setState(() => _wsConnected = false);
  }

  Future<void> _refresh() async {
    await _loadQueue();
  }

  Future<void> _logout() async {
    _wsService?.disconnect();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('clinic_code');
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  Color get _accentColor =>
      _settings != null ? hexColor(_settings!.accentColor) : const Color(0xFF22c55e);

  @override
  void dispose() {
    _wsService?.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final clinicName = _settings?.name ?? widget.clinicCode;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: _accentColor,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(clinicName,
                style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.bold)),
            Text(
              _wsConnected ? 'Na żywo' : 'Łączenie…',
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Odśwież',
            onPressed: _refresh,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Wyloguj',
            onPressed: _logout,
          ),
        ],
      ),
      body: Consumer<QueueProvider>(
        builder: (context, queue, _) {
          if (queue.loading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (queue.error != null) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline,
                      size: 48, color: Colors.grey),
                  const SizedBox(height: 12),
                  Text(queue.error!,
                      style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _refresh,
                    child: const Text('Spróbuj ponownie'),
                  ),
                ],
              ),
            );
          }
          if (queue.visits.isEmpty) {
            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                children: [
                  SizedBox(
                    height: MediaQuery.of(context).size.height * 0.6,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.pets,
                            size: 72, color: Colors.grey[300]),
                        const SizedBox(height: 16),
                        Text(
                          'Brak pacjentów w kolejce',
                          style: TextStyle(
                              fontSize: 16, color: Colors.grey[400]),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView.builder(
              padding: const EdgeInsets.only(top: 8, bottom: 16),
              itemCount: queue.visits.length,
              itemBuilder: (ctx, i) =>
                  VisitCard(visit: queue.visits[i]),
            ),
          );
        },
      ),
    );
  }
}
