import 'package:flutter/material.dart';

class DuressProtectionService {
  /**
   * Section 4: Duress cancellation / coercion protection.
   * Allows a user to 'cancel' an alert while actually alerting operators.
   */
  bool isDuressCode(String inputCode, String savedDuressCode) {
    if (inputCode == savedDuressCode) {
      // TRIGGER DURESS PROTOCOL: 
      // UI shows "Incident Cancelled" but backend marks as "HIGH DANGER - COERCION"
      return true;
    }
    return false;
  }

  void handleCancellation(BuildContext context, bool wasDuress) {
    if (wasDuress) {
      // Subtle transition: App goes to home screen but keeps tracking in background
      Navigator.of(context).popToRoot();
      _silentAlertOperator();
    } else {
      // Normal cancellation
    }
  }

  void _silentAlertOperator() {
    // Send background payload: { "status": "CANCELLED_BY_USER", "coercion_flag": true }
  }
}
