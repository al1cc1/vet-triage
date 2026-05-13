import 'package:flutter/material.dart';
import '../config.dart';

class TriageBadge extends StatelessWidget {
  final String category;

  const TriageBadge({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: categoryColor(category),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        _label(category),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  static String _label(String cat) {
    switch (cat) {
      case 'RED':
        return 'KRYTYCZNY';
      case 'ORANGE':
        return 'PILNY';
      case 'YELLOW':
        return 'MNIEJ PILNY';
      case 'GREEN':
        return 'PLANOWY';
      default:
        return cat;
    }
  }
}
