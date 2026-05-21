/// Shared utility to parse MongoDB ObjectId fields.
/// Handles String, Map with $oid key, and null values.
String? parseObjectId(dynamic raw) {
  if (raw == null) return null;
  if (raw is String) return raw;
  if (raw is Map && raw.containsKey('\$oid')) return raw['\$oid'] as String;
  return raw.toString();
}
