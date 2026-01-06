// android/app/src/main/java/com/screenshotmanager/ScreenshotWatcherModule.kt
package com.screenshotmanager

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.FileObserver
import android.provider.Settings
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class ScreenshotWatcherModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val MODULE_NAME = "ScreenshotWatcherModule"
        private const val CHANNEL_ID = "screenshot_watcher_channel"
        private const val NOTIFICATION_ID = 1001
    }

    private var fileObserver: FileObserver? = null
    private var destinationPath: String? = null

    override fun getName(): String = MODULE_NAME

    init {
        createNotificationChannel()
    }

    @ReactMethod
    fun openManageAllFilesSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
                data = Uri.parse("package:${reactContext.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to open settings: ${e.message}")
        }
    }

    @ReactMethod
    fun startWatching(sourcePath: String, destPath: String, promise: Promise) {
        try {
            this.destinationPath = destPath

            // Create destination folder if it doesn't exist
            val destFolder = File(destPath)
            if (!destFolder.exists()) {
                destFolder.mkdirs()
            }

            // Start foreground notification
            startForegroundNotification()

            // Create FileObserver for the source path
            fileObserver = object : FileObserver(sourcePath, CREATE or MOVED_TO) {
                override fun onEvent(event: Int, fileName: String?) {
                    fileName?.let {
                        if (isScreenshotFile(it)) {
                            handleNewScreenshot(sourcePath, it)
                        }
                    }
                }
            }

            fileObserver?.startWatching()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to start watching: ${e.message}")
        }
    }

    @ReactMethod
    fun stopWatching(promise: Promise) {
        try {
            fileObserver?.stopWatching()
            fileObserver = null

            // Remove notification
            val notificationManager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            notificationManager?.cancel(NOTIFICATION_ID)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to stop watching: ${e.message}")
        }
    }

    private fun isScreenshotFile(fileName: String): Boolean {
        val lowerName = fileName.lowercase()
        return (lowerName.contains("screenshot") || lowerName.contains("screencap")) &&
                (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") ||
                        lowerName.endsWith(".png") || lowerName.endsWith(".webp"))
    }

    private fun handleNewScreenshot(sourcePath: String, fileName: String) {
        try {
            val sourceFile = File(sourcePath, fileName)
            val destFile = File(destinationPath, fileName)

            // Wait a bit for the file to be fully written
            Thread.sleep(500)

            // Copy the file
            if (sourceFile.exists() && !destFile.exists()) {
                copyFile(sourceFile, destFile)

                // Send event to React Native
                sendEvent("onNewScreenshot", fileName)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun copyFile(source: File, dest: File) {
        FileInputStream(source).use { inStream ->
            FileOutputStream(dest).use { outStream ->
                val buffer = ByteArray(1024)
                var length: Int
                while (inStream.read(buffer).also { length = it } > 0) {
                    outStream.write(buffer, 0, length)
                }
            }
        }
    }

    private fun sendEvent(eventName: String, fileName: String) {
        val params = Arguments.createMap().apply {
            putString("fileName", fileName)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screenshot Monitoring",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors for new screenshots"
            }

            val manager = reactContext.getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun startForegroundNotification() {
        val intent = Intent(reactContext, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            reactContext,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setContentTitle("Screenshot Manager")
            .setContentText("Monitoring for new screenshots")
            .setSmallIcon(android.R.drawable.ic_menu_gallery)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        val notificationManager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        notificationManager?.notify(NOTIFICATION_ID, notification)
    }
}