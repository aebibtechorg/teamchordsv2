class SetList {
  final String id;
  final String name;

  SetList({required this.id, required this.name});

  factory SetList.fromJson(Map<String, dynamic> json) {
    return SetList(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? json['Name'] ?? '',
    );
  }
}
