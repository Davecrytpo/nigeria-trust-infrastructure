import 'package:flutter/services.dart';

class DeviceContact {
  const DeviceContact({
    required this.name,
    required this.phone,
  });

  final String name;
  final String phone;
}

class DeviceContactsService {
  static const _channel = MethodChannel('ekotrust_mobile/contacts');

  Future<List<DeviceContact>> getContacts() async {
    final raw =
        await _channel.invokeListMethod<dynamic>('getContacts') ?? const [];
    return raw
        .whereType<Map<dynamic, dynamic>>()
        .map(
          (item) => DeviceContact(
            name: item['name']?.toString() ?? '',
            phone: item['phone']?.toString() ?? '',
          ),
        )
        .where(
          (item) => item.name.trim().isNotEmpty && item.phone.trim().isNotEmpty,
        )
        .toList(growable: false);
  }
}
