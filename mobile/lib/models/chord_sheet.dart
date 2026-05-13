class ChordSheet {
  final String id;
  final String title;
  final String artist;
  final String content;
  final String key;

  ChordSheet({required this.id, required this.title, required this.artist, required this.content, required this.key});

  factory ChordSheet.fromJson(Map<String, dynamic> json) {
    return ChordSheet(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? json['Title'] ?? '',
      artist: json['artist'] ?? json['Artist'] ?? '',
      content: json['content'] ?? json['Content'] ?? '',
      key: json['key'] ?? json['Key'] ?? '',
    );
  }
}
