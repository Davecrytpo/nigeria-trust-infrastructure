// ignore_for_file: prefer_const_constructors

import 'package:geolocator/geolocator.dart';

class BatteryOptimizedLocationService {
  /// Section 12: Low-battery verification mode.
  /// Dynamically degrades GPS frequency based on battery state.
  Stream<Position> getVerificationLocationStream(int batteryPercentage) {
    LocationSettings settings;

    if (batteryPercentage < 15) {
      // ULTRA-LOW MODE: Sync every 2 minutes, low accuracy
      settings = AndroidSettings(
        accuracy: LocationAccuracy.low,
        distanceFilter: 100,
        intervalDuration: Duration(minutes: 2),
      );
    } else if (batteryPercentage < 30) {
      // BALANCED MODE: Sync every 30 seconds
      settings = AndroidSettings(
        accuracy: LocationAccuracy.medium,
        distanceFilter: 50,
        intervalDuration: Duration(seconds: 30),
      );
    } else {
      // HIGH PERFORMANCE: Real-time
      settings = AndroidSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
        intervalDuration: Duration(seconds: 5),
      );
    }

    return Geolocator.getPositionStream(locationSettings: settings);
  }

  double gpsConfidence(Position position) {
    final accuracy = position.accuracy;
    if (accuracy <= 15) return 1;
    if (accuracy <= 50) return 0.75;
    if (accuracy <= 100) return 0.5;
    return 0.25;
  }

  double deviceHealthScore({
    required int batteryPercentage,
    required bool isBatterySaverEnabled,
    required double signalQuality,
    Position? lastPosition,
  }) {
    final batteryScore = batteryPercentage >= 50
        ? 1.0
        : batteryPercentage >= 25
            ? 0.75
            : batteryPercentage >= 15
                ? 0.5
                : 0.25;
    final saverPenalty = isBatterySaverEnabled ? 0.15 : 0.0;
    final gpsScore = lastPosition == null ? 0.5 : gpsConfidence(lastPosition);
    final score = (batteryScore * 0.4) +
        (signalQuality.clamp(0, 1) * 0.4) +
        (gpsScore * 0.2) -
        saverPenalty;
    return score.clamp(0, 1).toDouble();
  }
}
