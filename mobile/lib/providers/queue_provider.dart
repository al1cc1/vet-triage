import 'package:flutter/foundation.dart';
import '../models/visit.dart';

class QueueProvider extends ChangeNotifier {
  List<Visit> _visits = [];
  bool _loading = false;
  String? _error;

  List<Visit> get visits => _visits;
  bool get loading => _loading;
  String? get error => _error;

  void setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }

  void setVisits(List<Visit> visits) {
    _visits = visits;
    _loading = false;
    _error = null;
    notifyListeners();
  }

  void setError(String error) {
    _error = error;
    _loading = false;
    notifyListeners();
  }
}
