import 'package:resident_mobile/features/emergency/domain/resident_emergency_models.dart';

class ResidentCopy {
  const ResidentCopy(this.language);

  final ResidentLanguage language;

  String get appTitle => _pick(
        english: 'Resident emergency',
        pidgin: 'Emergency help',
        yoruba: 'Iranlowo pajawiri',
        hausa: 'Taimakon gaggawa',
        igbo: 'Enyemaka mberede',
      );

  String get readyTitle => _pick(
        english: 'Emergency help is ready',
        pidgin: 'Help dey ready',
        yoruba: 'Iranlowo ti setan',
        hausa: 'Taimako ya shirya',
        igbo: 'Enyemaka adila njikere',
      );

  String get readyBody => _pick(
        english: 'Hold SOS for 3 seconds. If data fails, SMS fallback stays visible.',
        pidgin: 'Hold SOS for 3 seconds. If data no work, SMS backup go show.',
        yoruba: 'Di SOS mu fun sekondi meta. Ti data ba kuna, SMS afehinti yoo han.',
        hausa: 'Rike SOS na dakika uku. Idan data ta kasa, SMS na baya zai bayyana.',
        igbo: 'Jide SOS sekondi ato. O buru na data ada, SMS nkwado ga-aputa.',
      );

  String get silentTitle => _pick(
        english: 'Silent panic is active',
        pidgin: 'Silent panic don start',
        yoruba: 'Ipe ipalemo ipalolo n sise',
        hausa: 'Kiran shiru yana aiki',
        igbo: 'Oku nzuzo amalitela',
      );

  String get contacts => _pick(
        english: 'Trusted contacts',
        pidgin: 'People wey you trust',
        yoruba: 'Awon olubasoro igbeke',
        hausa: 'Mutanen amincewa',
        igbo: 'Ndi a tụkwasiri obi',
      );

  String get accessibility => _pick(
        english: 'Accessibility mode',
        pidgin: 'Easy read mode',
        yoruba: 'Ipo kika rorun',
        hausa: 'Yanayin saukin karatu',
        igbo: 'Uzo ogugu di mfe',
      );

  String get offlineQueue => _pick(
        english: 'Offline queue',
        pidgin: 'Offline queue',
        yoruba: 'Ila aisinipo',
        hausa: 'Jerin offline',
        igbo: 'Ahiri offline',
      );

  String _pick({
    required String english,
    required String pidgin,
    required String yoruba,
    required String hausa,
    required String igbo,
  }) {
    switch (language) {
      case ResidentLanguage.english:
        return english;
      case ResidentLanguage.pidgin:
        return pidgin;
      case ResidentLanguage.yoruba:
        return yoruba;
      case ResidentLanguage.hausa:
        return hausa;
      case ResidentLanguage.igbo:
        return igbo;
    }
  }
}
