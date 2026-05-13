import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/visit.dart';
import '../config.dart';
import 'triage_badge.dart';

class VisitCard extends StatefulWidget {
  final Visit visit;

  const VisitCard({super.key, required this.visit});

  @override
  State<VisitCard> createState() => _VisitCardState();
}

class _VisitCardState extends State<VisitCard> {
  late Timer _timer;
  late int _remaining;

  @override
  void initState() {
    super.initState();
    _remaining = _calcRemaining();
    // Odświeżaj co minutę
    _timer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) setState(() => _remaining = _calcRemaining());
    });
  }

  @override
  void didUpdateWidget(VisitCard old) {
    super.didUpdateWidget(old);
    if (old.visit.id != widget.visit.id ||
        old.visit.waitingMinutes != widget.visit.waitingMinutes) {
      setState(() => _remaining = _calcRemaining());
    }
  }

  int _calcRemaining() {
    final elapsed =
        DateTime.now().difference(widget.visit.createdAt).inMinutes;
    return widget.visit.waitingMinutes - elapsed;
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = categoryColor(widget.visit.triageCategory);
    final bg = categoryBg(widget.visit.triageCategory);
    final speciesBreed = widget.visit.breed != null
        ? '${widget.visit.species} / ${widget.visit.breed}'
        : widget.visit.species;

    final waitText = _remaining <= 0
        ? 'Teraz'
        : _remaining <= 5
            ? '<5 min'
            : '$_remaining min';
    final waitColor = _remaining <= 5 ? const Color(0xFFef4444) : Colors.grey[600]!;

    return Card(
      elevation: 1,
      color: bg,
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Kolorowy pionowy pasek
            Container(
              width: 6,
              decoration: BoxDecoration(
                color: color,
                borderRadius: const BorderRadius.horizontal(
                    left: Radius.circular(10)),
              ),
            ),
            // Zawartość karty
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            widget.visit.animalName,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        TriageBadge(category: widget.visit.triageCategory),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      speciesBreed,
                      style: TextStyle(
                          fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      widget.visit.reason,
                      style: const TextStyle(fontSize: 13),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.timer_outlined,
                                size: 14, color: waitColor),
                            const SizedBox(width: 3),
                            Text(
                              waitText,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: waitColor,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          DateFormat('HH:mm').format(widget.visit.createdAt),
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey[500]),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
