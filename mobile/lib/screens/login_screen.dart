import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'queue_screen.dart';

/// Automatycznie formatuje kod kliniki do formatu XXX-XXXX
class _ClinicCodeFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    // Zostawiamy tylko cyfry i litery, max 7 znaków (bez myślnika)
    String raw = newValue.text.toUpperCase().replaceAll(RegExp(r'[^A-Z0-9]'), '');
    if (raw.length > 7) raw = raw.substring(0, 7);

    final buf = StringBuffer();
    for (int i = 0; i < raw.length; i++) {
      if (i == 3) buf.write('-');
      buf.write(raw[i]);
    }
    final text = buf.toString();
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _codeCtrl.dispose();
    _pinCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await ApiService.mobileLogin(
        _codeCtrl.text.trim(),
        _pinCtrl.text.trim(),
      );
      final token = result['token'] as String;
      final clinicCode = result['clinicCode'] as String;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', token);
      await prefs.setString('clinic_code', clinicCode);

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
            builder: (_) => QueueScreen(clinicCode: clinicCode)),
      );
    } on Exception catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 48),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Logo
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFF22c55e),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Icon(Icons.local_hospital,
                      color: Colors.white, size: 40),
                ),
                const SizedBox(height: 16),
                const Text(
                  'VetTriage',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1e293b),
                  ),
                ),
                Text(
                  'Panel lekarza',
                  style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                ),
                const SizedBox(height: 40),

                // Kod kliniki
                TextFormField(
                  controller: _codeCtrl,
                  decoration: InputDecoration(
                    labelText: 'Kod kliniki',
                    hintText: 'ABC-1234',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10)),
                    prefixIcon: const Icon(Icons.business),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  inputFormatters: [_ClinicCodeFormatter()],
                  textCapitalization: TextCapitalization.characters,
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Podaj kod kliniki';
                    if (!RegExp(r'^[A-Z0-9]{3}-[A-Z0-9]{4}$').hasMatch(v)) {
                      return 'Format: XXX-XXXX';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // PIN kliniki
                TextFormField(
                  controller: _pinCtrl,
                  decoration: InputDecoration(
                    labelText: 'PIN kliniki',
                    hintText: '4–6 cyfr',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10)),
                    prefixIcon: const Icon(Icons.pin),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Podaj PIN';
                    if (v.length < 4) return 'PIN musi mieć 4–6 cyfr';
                    return null;
                  },
                ),
                const SizedBox(height: 8),

                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      _error!,
                      style: const TextStyle(
                          color: Color(0xFFef4444), fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                  ),

                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF22c55e),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2),
                          )
                        : const Text(
                            'Połącz',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w600),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
