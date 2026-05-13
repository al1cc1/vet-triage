class Visit {
  final String id;
  final DateTime createdAt;
  final String reason;
  final String triageCategory;
  final int waitingMinutes;
  final String status;
  final String animalName;
  final String species;
  final String? breed;
  final String gender;
  final double? ageYears;
  final String? color;
  final double? weightKg;
  final String ownerFullName;
  final String ownerPhone;

  const Visit({
    required this.id,
    required this.createdAt,
    required this.reason,
    required this.triageCategory,
    required this.waitingMinutes,
    required this.status,
    required this.animalName,
    required this.species,
    this.breed,
    required this.gender,
    this.ageYears,
    this.color,
    this.weightKg,
    required this.ownerFullName,
    required this.ownerPhone,
  });

  factory Visit.fromJson(Map<String, dynamic> json) {
    return Visit(
      id: json['id'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      reason: json['reason'] as String? ?? '',
      triageCategory: json['triageCategory'] as String,
      waitingMinutes: json['waitingMinutes'] as int? ?? 0,
      status: json['status'] as String,
      animalName: json['animalName'] as String,
      species: json['species'] as String,
      breed: json['breed'] as String?,
      gender: json['gender'] as String? ?? '',
      ageYears: (json['ageYears'] as num?)?.toDouble(),
      color: json['color'] as String?,
      weightKg: (json['weightKg'] as num?)?.toDouble(),
      ownerFullName: json['ownerFullName'] as String,
      ownerPhone: json['ownerPhone'] as String? ?? '',
    );
  }
}
