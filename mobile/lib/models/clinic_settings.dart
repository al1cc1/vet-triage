class ClinicSettings {
  final String accentColor;
  final String language;
  final String clinicCode;
  final String name;

  const ClinicSettings({
    required this.accentColor,
    required this.language,
    required this.clinicCode,
    required this.name,
  });

  factory ClinicSettings.fromJson(Map<String, dynamic> json) {
    return ClinicSettings(
      accentColor: json['accentColor'] as String? ?? '#22c55e',
      language: json['language'] as String? ?? 'pl',
      clinicCode: json['clinicCode'] as String,
      name: json['name'] as String,
    );
  }
}
