class ApiConfig {
  ApiConfig._();

  static const defaultBaseUrl = String.fromEnvironment(
    'EKOTRUST_API_BASE_URL',
    defaultValue: 'http://192.168.1.110:3000',
  );

  static String normalizeBaseUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.endsWith('/')) {
      return trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed;
  }
}
