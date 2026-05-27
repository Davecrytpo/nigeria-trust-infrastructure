package com.ekotrust.mobile

import android.Manifest
import android.content.pm.PackageManager
import android.provider.ContactsContract
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val channelName = "ekotrust_mobile/contacts"
    private val contactsRequestCode = 4281
    private var pendingContactsResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName).setMethodCallHandler { call, result ->
            when (call.method) {
                "getContacts" -> getContacts(result)
                else -> result.notImplemented()
            }
        }
    }

    private fun getContacts(result: MethodChannel.Result) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            pendingContactsResult = result
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.READ_CONTACTS), contactsRequestCode)
            return
        }
        result.success(readContacts())
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == contactsRequestCode) {
            val result = pendingContactsResult
            pendingContactsResult = null
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                result?.success(readContacts())
            } else {
                result?.error("contacts_denied", "Contacts permission was not granted.", null)
            }
        }
    }

    private fun readContacts(): List<Map<String, String>> {
        val contacts = mutableListOf<Map<String, String>>()
        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER
        )
        contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            projection,
            null,
            null,
            "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} ASC"
        )?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
            val phoneIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
            val seen = mutableSetOf<String>()
            while (cursor.moveToNext() && contacts.size < 500) {
                val name = cursor.getString(nameIndex) ?: ""
                val phone = cursor.getString(phoneIndex) ?: ""
                val normalized = phone.filter { it.isDigit() || it == '+' }
                if (name.isNotBlank() && normalized.isNotBlank() && seen.add(normalized)) {
                    contacts.add(mapOf("name" to name, "phone" to normalized))
                }
            }
        }
        return contacts
    }
}
